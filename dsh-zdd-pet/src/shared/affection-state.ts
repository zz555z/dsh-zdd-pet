/** 心情与长期亲密度的纯状态迁移和转移；时间由调用方传入。 */
import { clampMood, decayMood } from './mood.ts';

/** 双端共用的新状态键前缀；旧心情键只在首次迁移时读取。 */
export const AFFECTION_KEY_PREFIX = 'dsh-zdd-pet-affection-v1-';

/** 独立保存短期心情、长期亲密度及心情结算时刻。 */
export interface AffectionState {
  readonly stateVersion: 1;
  readonly mood: number;
  readonly intimacy: number;
  /** 心情已结算到的 Unix 毫秒数。 */
  readonly savedAt: number;
}

/** 从新状态恢复，或把旧心情原值一次性迁入长期亲密度。 */
export function restoreAffection(input: {
  readonly stored: unknown;
  readonly legacy: unknown;
  readonly initial: number;
  readonly now: number;
}): AffectionState {
  const stored = asRecord(input.stored);
  if (stored?.stateVersion === 1 && isFiniteNumber(stored.mood) && isFiniteNumber(stored.intimacy)) {
    return {
      stateVersion: 1,
      mood: clampMood(stored.mood),
      intimacy: clampMood(stored.intimacy),
      savedAt: isFiniteNumber(stored.savedAt) ? Math.min(stored.savedAt, input.now) : input.now,
    };
  }
  const legacy = asRecord(input.legacy);
  const value = clampMood(isFiniteNumber(legacy?.v) ? legacy.v : input.initial);
  return {
    stateVersion: 1,
    mood: value,
    intimacy: value,
    savedAt: isFiniteNumber(legacy?.t) ? Math.min(legacy.t, input.now) : input.now,
  };
}

/** 结算到指定时刻，只衰减心情，时钟回拨时保留原结算时刻。 */
export function decayAffection(state: AffectionState, now: number, rate: number): AffectionState {
  const savedAt = Math.max(state.savedAt, now);
  return { ...state, mood: decayMood(state.mood, savedAt - state.savedAt, rate), savedAt };
}

/** 互动同时增加心情和亲密度；负向心情变化不会扣除长期亲密度。 */
export function touchAffection(state: AffectionState, gain: number): AffectionState {
  const amount = Number.isFinite(gain) ? gain : 0;
  return { ...state, mood: clampMood(state.mood + amount), intimacy: clampMood(state.intimacy + Math.max(0, amount)) };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
