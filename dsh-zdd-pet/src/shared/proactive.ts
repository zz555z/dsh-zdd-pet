/**
 * 主动关心 & 长期记忆的配置形状与纯逻辑（浏览器与桌面端共用配置解析；判据主要在 host）。
 *
 * 主动关心：宠物在合适时机（久未搭理 / 深夜还在忙 / 刚做完一段长专注）自己冒一句关心。
 * 长期记忆：从对话里抽取「可长期记住的事实」（你是谁、在做什么、偏好），存起来，
 * 下次对话拼进 system prompt，让宠物接得上话。
 *
 * 本文件只放配置形状、默认值、校验与纯判据（不碰 IO / 定时器 / 模型）。
 * @module dsh-zdd-pet/src/shared/proactive
 */

/** 主动关心配置（config.jsonc 的 proactive 段）。 */
export interface ProactiveParams {
  /** 是否启用主动关心。 */
  enabled: boolean;
  /** 同一只宠物两次主动关心的最小间隔（小时）；防止刷屏。 */
  cooldownHours: number;
  /** 多久没交互算「久未搭理」（小时）；达到即可能触发一次关心。 */
  idleHours: number;
  /** 深夜时段（小时，0~23）：当前小时落在此区间且最近在工作活动 → 可能提醒休息。 */
  lateNightFrom: number;
  lateNightTo: number;
  /** 是否启用长期记忆（从对话抽取事实，拼进 system prompt）。 */
  longMemory: boolean;
}

/** 内置默认（与 assets/config.jsonc 的 proactive 段保持一致）。 */
export const DEFAULT_PROACTIVE: ProactiveParams = {
  enabled: true,
  cooldownHours: 6,
  idleHours: 8,
  lateNightFrom: 23,
  lateNightTo: 5,
  longMemory: true,
};

/** 小时数合法上限（天）。 */
const HOUR_MAX = 24 * 30;

/** 解析 proactive 段；缺失/非法 → 默认值。 */
export function readProactiveParams(raw: unknown): ProactiveParams {
  const d = DEFAULT_PROACTIVE;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...d };
  const o = raw as Record<string, unknown>;
  const num = (v: unknown, fb: number, min: number, max: number): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : fb;
  };
  const hour = (v: unknown, fb: number): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 23 ? Math.floor(n) : fb;
  };
  return {
    enabled: o.enabled !== false,
    cooldownHours: num(o.cooldownHours, d.cooldownHours, 1, HOUR_MAX),
    idleHours: num(o.idleHours, d.idleHours, 1, HOUR_MAX),
    lateNightFrom: hour(o.lateNightFrom, d.lateNightFrom),
    lateNightTo: hour(o.lateNightTo, d.lateNightTo),
    longMemory: o.longMemory !== false,
  };
}

/**
 * proactive 段校验：enabled / longMemory 布尔；cooldownHours / idleHours 若出现须在 [1, 720]；
 * lateNightFrom / lateNightTo 若出现须是 0~23 的整数。
 */
export function proactiveValid(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.enabled !== 'boolean') return false;
  if (o.longMemory !== undefined && typeof o.longMemory !== 'boolean') return false;
  for (const key of ['cooldownHours', 'idleHours'] as const) {
    if (o[key] === undefined) continue;
    const n = Number(o[key]);
    if (!Number.isFinite(n) || n < 1 || n > HOUR_MAX) return false;
  }
  for (const key of ['lateNightFrom', 'lateNightTo'] as const) {
    if (o[key] === undefined) continue;
    const n = Number(o[key]);
    if (!Number.isInteger(n) || n < 0 || n > 23) return false;
  }
  return true;
}

/** 主动关心的触发原因。 */
export type CareReason = 'idle' | 'late-night' | 'after-focus';

/** 判断某小时是否落在深夜区间（支持跨午夜，如 23→5）。 */
export function isLateNight(hour: number, from: number, to: number): boolean {
  if (!Number.isFinite(hour)) return false;
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (from <= to) return h >= from && h < to; // 同一天内（如 1→4）
  return h >= from || h < to; // 跨午夜（如 23→5）
}

/** 主动关心判据的输入（全部是纯数据，时间由调用方传入，便于单测）。 */
export interface CareDecisionInput {
  params: ProactiveParams;
  /** 现在（毫秒时间戳）。 */
  now: number;
  /** 上次交互（对话/点击/工作活动）的时刻（毫秒）；0 = 从没交互过。 */
  lastInteractionAt: number;
  /** 上次主动关心的时刻（毫秒）；0 = 从没关心过。 */
  lastCareAt: number;
  /** 当前小时（0~23）。 */
  hour: number;
  /** 最近一小段时间内是否在工作活动（用于「深夜还在忙」的提醒）。 */
  recentlyActive: boolean;
  /** 刚刚结束一段长专注（番茄钟专注阶段结束）——一次性信号，消费后由调用方清掉。 */
  justFinishedFocus: boolean;
}

/**
 * 决定现在要不要主动关心、以及为什么。
 *
 * 优先级：刚做完一段长专注 > 深夜还在忙 > 久未搭理。同一只宠物在冷却期内一律不触发。
 *
 * @returns 触发原因；不该触发 → null。
 */
export function decideCare(input: CareDecisionInput): CareReason | null {
  const p = input.params;
  if (!p.enabled) return null;
  const cdMs = p.cooldownHours * 3_600_000;
  if (input.lastCareAt > 0 && input.now - input.lastCareAt < cdMs) return null; // 冷却中
  // 1) 刚结束长专注：最贴合时机，优先。
  if (input.justFinishedFocus) return 'after-focus';
  // 2) 深夜还在忙：深夜时段 + 最近有活动。
  if (isLateNight(input.hour, p.lateNightFrom, p.lateNightTo) && input.recentlyActive) return 'late-night';
  // 3) 久未搭理：距上次交互超过 idleHours。
  if (input.lastInteractionAt > 0 && input.now - input.lastInteractionAt >= p.idleHours * 3_600_000) return 'idle';
  return null;
}

/** 一条长期记忆（事实）。 */
export interface MemoryFact {
  /** 事实正文（一句话，越简洁越好）。 */
  text: string;
  /** 记录时刻（毫秒）。 */
  ts: number;
}

/** 长期记忆每只宠物最多保留的事实条数。 */
export const MEMORY_FACT_MAX = 40;
