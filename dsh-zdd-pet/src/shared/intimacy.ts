/**
 * 亲密度阶段系统的纯逻辑（浏览器与桌面端共用）。
 *
 * 在既有心情数值（mood 0~100）之上再切出四个「阶段」，给桌宠一条成长故事线：
 * 陌生 → 熟悉 → 亲近 → 默契。每阶段带一份专属点击台词、一句阶段标语、一个专属节日名
 * （首次达到某阶段的周年日 = 该阶段的「纪念日」，由 host/festival.ts 触发演出）。
 *
 * 只做数值→阶段的判定与阶段属性查询，不碰存储 / DOM / 定时器（那些在两端各自实现）。
 * @module dsh-zdd-pet/src/shared/intimacy
 */

/** 亲密度阶段（由低到高）。 */
export type IntimacyTier = 'stranger' | 'familiar' | 'close' | 'bonded';

/** 阶段顺序（索引越大越亲密）。 */
export const INTIMACY_TIERS: readonly IntimacyTier[] = ['stranger', 'familiar', 'close', 'bonded'];

/** 一个阶段的属性。 */
export interface IntimacyStage {
  /** 阶段中文名（悬浮提示 / 气泡用） */
  label: string;
  /** 一句阶段标语（达成时播报，或悬浮展示） */
  motto: string;
  /** 该阶段的专属点击台词池（心情启用时优先于 mood.texts 使用） */
  texts: string[];
  /** 达成该阶段纪念日时的节日名（可为空 = 不设纪念日） */
  festival?: string;
  /** 达成该阶段纪念日时的祝福/台词（可为空 = 用通用模板） */
  festivalText?: string;
}

/** config.jsonc 的 intimacy 段。 */
export interface IntimacyParams {
  /** 是否启用亲密度阶段（关闭则只保留原有 mood 三档行为，不播阶段解锁/纪念日） */
  enabled: boolean;
  /** 四个阶段各自的属性（键固定为四个阶段名）。 */
  stages: Record<IntimacyTier, IntimacyStage>;
}

/** 阶段边界（含下界）：数值 >= 该阈值即进入此阶段。 */
export const INTIMACY_THRESHOLDS: Readonly<Record<IntimacyTier, number>> = {
  stranger: 0,
  familiar: 25,
  close: 50,
  bonded: 75,
};

/** 内置默认（与 assets/config.jsonc 的 intimacy 段保持一致，改一处须同步另一处）。 */
export const DEFAULT_INTIMACY: IntimacyParams = {
  enabled: true,
  stages: {
    stranger: {
      label: '陌生',
      motto: '我们才刚认识呢…',
      texts: [],
    },
    familiar: {
      label: '熟悉',
      motto: '混熟啦，见到你就想打招呼～',
      texts: ['今天也来啦？', '嘿嘿，又见面咯～'],
      festival: '相识纪念日',
      festivalText: '还记得我们第一次见面吗？谢谢你一直陪着我～',
    },
    close: {
      label: '亲近',
      motto: '越来越想腻着你啦～',
      texts: ['今天也想黏着你～', '有你在就很安心～'],
      festival: '亲近纪念日',
      festivalText: '我们已经这么要好啦，往后也要一直在一起哦～',
    },
    bonded: {
      label: '默契',
      motto: '不说话也懂你～',
      texts: ['不用说话我也懂你哦～', '你最懂我啦～'],
      festival: '默契纪念日',
      festivalText: '默契满分！你是我最最重要的人啦～',
    },
  },
};

/** 由数值判阶段：取数值 ≥ 阈值里最高的那一档。 */
export function intimacyTierOf(value: number): IntimacyTier {
  const v = Number.isFinite(value) ? value : 0;
  let tier: IntimacyTier = 'stranger';
  for (const t of INTIMACY_TIERS) {
    if (v >= INTIMACY_THRESHOLDS[t]) tier = t;
  }
  return tier;
}

/** 阶段的中文序号（0..3，用于比较「是否升级」）。 */
export function intimacyRank(tier: IntimacyTier): number {
  return INTIMACY_TIERS.indexOf(tier);
}

/** 读某阶段的属性（缺省回退到内置默认同名阶段）。 */
export function intimacyStageOf(params: IntimacyParams, tier: IntimacyTier): IntimacyStage {
  const own = params.stages?.[tier];
  const def = DEFAULT_INTIMACY.stages[tier];
  if (!own) return def;
  return {
    label: typeof own.label === 'string' && own.label ? own.label : def.label,
    motto: typeof own.motto === 'string' ? own.motto : def.motto,
    texts: Array.isArray(own.texts)
      ? own.texts.filter((s): s is string => typeof s === 'string' && s.trim() !== '')
      : def.texts,
    festival: typeof own.festival === 'string' && own.festival ? own.festival : def.festival,
    festivalText: typeof own.festivalText === 'string' && own.festivalText ? own.festivalText : def.festivalText,
  };
}

/**
 * 阶段专属点击台词池：有非空台词就用它，否则回退传入的兜底池（通常是 mood 台词或 clickTexts）。
 */
export function intimacyTextPool(
  params: IntimacyParams,
  tier: IntimacyTier,
  fallback: readonly string[] = [],
): readonly string[] {
  if (!params.enabled) return fallback;
  const pool = intimacyStageOf(params, tier).texts;
  return pool.length > 0 ? pool : fallback;
}

/** 某阶段是否是「阶段达成」需要庆祝：stranger 是起始态，不庆祝。 */
export function isPromotion(from: IntimacyTier, to: IntimacyTier): boolean {
  return intimacyRank(to) > intimacyRank(from);
}

/** 从任意 raw 里抽一个阶段配置（各子字段可选，非法回退默认）。 */
function stageRaw(raw: unknown, tier: IntimacyTier): IntimacyStage {
  const def = DEFAULT_INTIMACY.stages[tier];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return def;
  const o = raw as Record<string, unknown>;
  const str = (v: unknown, fb: string): string => (typeof v === 'string' && v.trim() !== '' ? v : fb);
  const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v : undefined);
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : def.texts;
  return {
    label: str(o.label, def.label),
    motto: typeof o.motto === 'string' ? o.motto : def.motto,
    texts: arr(o.texts),
    festival: optStr(o.festival) ?? def.festival,
    festivalText: optStr(o.festivalText) ?? def.festivalText,
  };
}

/** 解析 config 的 intimacy 段；缺失/非法 → 默认值。 */
export function readIntimacyParams(raw: unknown): IntimacyParams {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { enabled: DEFAULT_INTIMACY.enabled, stages: { ...DEFAULT_INTIMACY.stages } };
  }
  const o = raw as Record<string, unknown>;
  const rawStages = (o.stages && typeof o.stages === 'object' ? o.stages : {}) as Record<string, unknown>;
  const stages = {} as Record<IntimacyTier, IntimacyStage>;
  for (const t of INTIMACY_TIERS) stages[t] = stageRaw(rawStages[t], t);
  return { enabled: o.enabled !== false, stages };
}

/**
 * intimacy 段校验：enabled 必须是布尔；stages 若出现必须是对象（子字段非法会被读取侧逐项过滤，
 * 不整体判非法）。
 */
export function intimacyValid(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.enabled !== 'boolean') return false;
  if (o.stages !== undefined && (typeof o.stages !== 'object' || o.stages === null || Array.isArray(o.stages))) {
    return false;
  }
  return true;
}
