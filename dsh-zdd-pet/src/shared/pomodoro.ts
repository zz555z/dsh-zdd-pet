/**
 * 番茄钟参数的默认值与校验（浏览器设置页与宿主共用同一份规则）。
 *
 * 只提供「开关 + 间隔」这一层的默认与合法性判断；运行时到点投递由 host 的 pomodoro.ts 负责，
 * 文案池也归那里（本模块不关心 texts——设置页不编辑它，保存时透传保留）。
 * 必须始终成立：DEFAULT_POMODORO 与包内 config.jsonc 的 pomodoro 段一致，改一处须同步另一处。
 * @module dsh-zdd-pet/src/shared/pomodoro
 */
import type { PomodoroParams } from './types.ts';

/** 间隔下限（分钟）：太短会变成骚扰。 */
export const POMODORO_MIN_INTERVAL_MIN = 1;
/** 间隔上限（分钟）：一天最多几次，超过基本没意义。 */
export const POMODORO_MAX_INTERVAL_MIN = 1440;
/** 默认间隔（分钟）。 */
export const POMODORO_DEFAULT_INTERVAL_MIN = 50;

/** 内置默认（与 assets/config.jsonc 的 pomodoro 段保持一致）。 */
export const DEFAULT_POMODORO: PomodoroParams = { enabled: false, intervalMin: POMODORO_DEFAULT_INTERVAL_MIN };

/**
 * 设置页「久坐提醒」下拉框的预设分钟档位（选某个分钟数 = 启用并设该间隔；另有「关闭」档）。
 * 只影响设置页便利性：用户手改 config 写任意 1~1440 的值仍合法，下拉会把当前值动态补进来。
 */
export const POMODORO_PRESET_INTERVALS_MIN = [15, 25, 45, 50, 60, 90] as const;

/**
 * pomodoro 段校验：{ enabled: boolean, intervalMin: 1~1440 的有限整数范围 }。
 * 整段校验（与 physics/font 同口径）：任一子键缺失/非法即整段非法。
 * 设置页只写 enabled/intervalMin，texts 等其它键由保存侧透传，不参与本校验。
 */
export function pomodoroValid(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (typeof p.enabled !== 'boolean') return false;
  const n = Number(p.intervalMin);
  return Number.isFinite(n) && n >= POMODORO_MIN_INTERVAL_MIN && n <= POMODORO_MAX_INTERVAL_MIN;
}
