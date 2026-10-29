/**
 * 心情/亲密度系统的纯逻辑（浏览器与桌面端共用）。
 *
 * 只做数值计算与档位判定，不碰存储 / DOM / 定时器（那些在两端各自实现）。
 * 设计：心情 0~100；被摸涨、久不理随时间衰减；分低落/平常/开心三档，
 * 影响说话语气（点击台词按档位选池）与动作（低落更易打瞌睡、开心会撒娇）。
 * @module dsh-zdd-pet/src/shared/mood
 */
import type { MoodParams } from './types.ts';

/** 心情上下限。 */
export const MOOD_MIN = 0;
export const MOOD_MAX = 100;

/** 把心情夹到 0~100 的整数。 */
export function clampMood(v: number): number {
  if (!Number.isFinite(v)) return MOOD_MIN;
  return Math.max(MOOD_MIN, Math.min(MOOD_MAX, Math.round(v)));
}

/** 心情档位。 */
export type MoodTier = 'low' | 'normal' | 'high';

/** 由数值与阈值判档位：< low 低落、> high 开心、其余平常。 */
export function moodTier(value: number, low: number, high: number): MoodTier {
  const v = clampMood(value);
  if (v < low) return 'low';
  if (v > high) return 'high';
  return 'normal';
}

/**
 * 按经过的毫秒数衰减心情：每小时掉 decayPerHour 点。
 *
 * @param value - 上次保存的心情。
 * @param elapsedMs - 距上次更新的毫秒（<=0 视为不衰减）。
 * @param decayPerHour - 每小时衰减点数（<=0 不衰减）。
 * @returns 衰减后的心情（夹在 0~100）。
 */
export function decayMood(value: number, elapsedMs: number, decayPerHour: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || !Number.isFinite(decayPerHour) || decayPerHour <= 0) {
    return clampMood(value);
  }
  const hours = elapsedMs / 3_600_000;
  return clampMood(value - hours * decayPerHour);
}

/** 心情档位的中文标签（气泡提示用）。 */
export function moodLabel(tier: MoodTier): string {
  return tier === 'low' ? '有点闷' : tier === 'high' ? '超开心' : '还不错';
}

/** 解析 config 的 mood 段；非法/缺失 → 用默认值。 */
export function readMoodParams(raw: unknown): MoodParams {
  const d: MoodParams = {
    enabled: true,
    initial: 60,
    touchGain: 4,
    decayPerHour: 4,
    low: 30,
    high: 70,
    texts: { low: [], normal: [], high: [] },
  };
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const num = (k: keyof MoodParams, min: number, max: number): number => {
    const v = Number(o[k]);
    return Number.isFinite(v) && v >= min && v <= max ? v : (d[k] as number);
  };
  const texts = (o.texts && typeof o.texts === 'object' ? o.texts : {}) as Record<string, unknown>;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];
  return {
    enabled: o.enabled !== false,
    initial: num('initial', 0, 100),
    touchGain: num('touchGain', 0, 100),
    decayPerHour: num('decayPerHour', 0, 100),
    low: num('low', 0, 100),
    high: num('high', 0, 100),
    happyAnim: typeof o.happyAnim === 'string' ? o.happyAnim : undefined,
    sadAnim: typeof o.sadAnim === 'string' ? o.sadAnim : undefined,
    texts: { low: arr(texts.low), normal: arr(texts.normal), high: arr(texts.high) },
  };
}
