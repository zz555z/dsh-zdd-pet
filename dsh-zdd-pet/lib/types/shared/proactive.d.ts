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
export declare const DEFAULT_PROACTIVE: ProactiveParams;
/** 解析 proactive 段；缺失/非法 → 默认值。 */
export declare function readProactiveParams(raw: unknown): ProactiveParams;
/**
 * proactive 段校验：enabled / longMemory 布尔；cooldownHours / idleHours 若出现须在 [1, 720]；
 * lateNightFrom / lateNightTo 若出现须是 0~23 的整数。
 */
export declare function proactiveValid(value: unknown): boolean;
/** 主动关心的触发原因。 */
export type CareReason = 'idle' | 'late-night' | 'after-focus';
/** 判断某小时是否落在深夜区间（支持跨午夜，如 23→5）。 */
export declare function isLateNight(hour: number, from: number, to: number): boolean;
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
export declare function decideCare(input: CareDecisionInput): CareReason | null;
/** 一条长期记忆（事实）。 */
export interface MemoryFact {
    /** 事实正文（一句话，越简洁越好）。 */
    text: string;
    /** 记录时刻（毫秒）。 */
    ts: number;
}
/** 长期记忆每只宠物最多保留的事实条数。 */
export declare const MEMORY_FACT_MAX = 40;
