/**
 * 番茄钟参数的默认值、校验与展示小工具（浏览器设置页与宿主共用同一份规则）。
 *
 * 「开关 + 专注/休息时长」这层在这里；真正的计时状态机与投递在 host/pomodoro-engine.ts，
 * 文案池也归那里（本模块不关心 texts——设置页不编辑它，保存时透传保留）。
 * 必须始终成立：DEFAULT_POMODORO 与包内 config.jsonc 的 pomodoro 段一致，改一处须同步另一处。
 * @module dsh-zdd-pet/src/shared/pomodoro
 */
import type { PomodoroParams } from './types.ts';

/** 间隔下限（分钟）：太短会变成骚扰。 */
export const POMODORO_MIN_INTERVAL_MIN = 1;
/** 间隔上限（分钟）：一天最多几次，超过基本没意义。 */
export const POMODORO_MAX_INTERVAL_MIN = 1440;
/** 默认专注时长（分钟）。 */
export const POMODORO_DEFAULT_INTERVAL_MIN = 50;
/** 默认短休息 / 长休息（分钟）与长休息间隔轮数。 */
export const POMODORO_DEFAULT_BREAK_MIN = 5;
export const POMODORO_DEFAULT_LONG_BREAK_MIN = 15;
export const POMODORO_DEFAULT_ROUNDS = 4;

/** 内置默认（与 assets/config.jsonc 的 pomodoro 段保持一致）。 */
export const DEFAULT_POMODORO: PomodoroParams = {
  enabled: false,
  intervalMin: POMODORO_DEFAULT_INTERVAL_MIN,
  breakMin: POMODORO_DEFAULT_BREAK_MIN,
  longBreakMin: POMODORO_DEFAULT_LONG_BREAK_MIN,
  roundsBeforeLongBreak: POMODORO_DEFAULT_ROUNDS,
  autoStartBreak: true,
  autoStartFocus: false,
};

/**
 * 设置页「专注时长 / 久坐提醒」下拉框的预设分钟档位（另有「关闭」档）。
 * 只影响设置页便利性：用户手改 config 写任意 1~1440 的值仍合法，下拉会把当前值动态补进来。
 */
export const POMODORO_PRESET_INTERVALS_MIN = [15, 25, 45, 50, 60, 90] as const;

/** 设置页「休息时长」下拉框的预设分钟档位。 */
export const POMODORO_PRESET_BREAKS_MIN = [3, 5, 10, 15, 20, 30] as const;

/** 秒数 → mm:ss（超过 1 小时用 h:mm:ss）。非法 / 负数按 0。 */
export function formatPomodoroClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(Number.isFinite(totalSec) ? totalSec : 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? h + ':' + mm + ':' + ss : mm + ':' + ss;
}

/** 可选分钟时长校验：缺省合法；出现则必须在 1~1440。 */
function optionalMinutes(value: unknown): boolean {
  if (value === undefined) return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= POMODORO_MIN_INTERVAL_MIN && n <= POMODORO_MAX_INTERVAL_MIN;
}

/**
 * pomodoro 段校验：enabled 布尔、intervalMin 1~1440；breakMin / longBreakMin 可选但出现时同范围；
 * roundsBeforeLongBreak 可选 1~24；autoStartBreak / autoStartFocus 可选布尔。
 * 设置页只写 enabled / intervalMin / breakMin，texts 等其它键由保存侧透传，不参与本校验。
 */
export function pomodoroValid(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (typeof p.enabled !== 'boolean') return false;
  const n = Number(p.intervalMin);
  if (!Number.isFinite(n) || n < POMODORO_MIN_INTERVAL_MIN || n > POMODORO_MAX_INTERVAL_MIN) return false;
  if (!optionalMinutes(p.breakMin) || !optionalMinutes(p.longBreakMin)) return false;
  if (p.roundsBeforeLongBreak !== undefined) {
    const r = Number(p.roundsBeforeLongBreak);
    if (!Number.isInteger(r) || r < 1 || r > 24) return false;
  }
  if (p.autoStartBreak !== undefined && typeof p.autoStartBreak !== 'boolean') return false;
  if (p.autoStartFocus !== undefined && typeof p.autoStartFocus !== 'boolean') return false;
  return true;
}
