/**
 * 番茄钟 / 久坐提醒 —— 到点让桌宠说一句"该起来动动了"。
 *
 * 定位：**固定间隔**（不判断你在不在干活，用户显式选的"每 50 分钟一次"），
 * 所以实现上是纯定时器 + 一点随机文案，不需要监听任何会话事件，也不调模型（零 token）。
 *
 * 为什么单独成模块：间隔/文案/开关的解析是纯逻辑，能单测；host 侧只负责"起个定时器 + 到点投递"。
 *
 * 配置（条目级，与 workStatusTexts 同级）：
 *   "pomodoro": { "enabled": true, "intervalMin": 50, "texts": ["起来动动～", "喝口水吧"] }
 * 全部可选；不给 texts 就用内置默认几句。
 */
import {
  POMODORO_DEFAULT_BREAK_MIN,
  POMODORO_DEFAULT_INTERVAL_MIN,
  POMODORO_DEFAULT_LONG_BREAK_MIN,
  POMODORO_DEFAULT_ROUNDS,
  POMODORO_MAX_INTERVAL_MIN,
  POMODORO_MIN_INTERVAL_MIN,
} from '../shared/pomodoro.ts';

export interface PomodoroConfig {
  enabled: boolean;
  /** 专注时长（分钟）；>0 的有限数，否则回落到默认 50 */
  intervalMin: number;
  /** 短休息时长（分钟） */
  breakMin: number;
  /** 长休息时长（分钟） */
  longBreakMin: number;
  /** 每几轮专注后进入长休息 */
  roundsBeforeLongBreak: number;
  /** 专注结束后是否自动开始休息 */
  autoStartBreak: boolean;
  /** 休息结束后是否自动开始下一轮专注 */
  autoStartFocus: boolean;
  /** 专注结束 / 休息提醒文案 */
  texts: string[];
  /** 休息结束时的提醒文案 */
  breakTexts: string[];
}

// 间隔上下限与默认值只有一处真源（shared/pomodoro.ts，设置页与运行时共用），这里 re-export
// 保持既有导入方（测试、loops）不变。
export { POMODORO_DEFAULT_INTERVAL_MIN, POMODORO_MAX_INTERVAL_MIN, POMODORO_MIN_INTERVAL_MIN };

/** 默认文案（不配 texts 时用）——专注结束、该休息了 */
export const POMODORO_DEFAULT_TEXTS = [
  '起来动动呀，坐太久啦～',
  '该喝口水啦，别忘了～',
  '一坐就是这么久，伸个懒腰吧',
  '眼睛也歇会儿吧～',
];

/** 默认文案（不配 breakTexts 时用）——休息结束、该继续了 */
export const POMODORO_DEFAULT_BREAK_TEXTS = [
  '休息好啦，接着专注吧～',
  '充电完毕，继续加油！',
  '回来啦，下一轮开始咯～',
];

/**
 * 解析配置 → 生效值；未配置/关闭 → undefined（= 不起定时器）。
 * 间隔非法一律回落默认（不告警，这是"锦上添花"功能，配置写坏了不该报错打扰）。
 */
export function parsePomodoro(raw: unknown): PomodoroConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  // enabled 必须显式为 true 才开——默认关闭，避免悄悄打扰
  if (r.enabled !== true) return undefined;
  const minutes = (value: unknown, def: number): number => {
    const n = Number(value);
    return Number.isFinite(n) && n >= POMODORO_MIN_INTERVAL_MIN && n <= POMODORO_MAX_INTERVAL_MIN ? n : def;
  };
  const intervalMin = minutes(r.intervalMin, POMODORO_DEFAULT_INTERVAL_MIN);
  const breakMin = minutes(r.breakMin, POMODORO_DEFAULT_BREAK_MIN);
  const longBreakMin = minutes(r.longBreakMin, POMODORO_DEFAULT_LONG_BREAK_MIN);
  const rawRounds = Number(r.roundsBeforeLongBreak);
  const roundsBeforeLongBreak =
    Number.isInteger(rawRounds) && rawRounds >= 1 && rawRounds <= 24 ? rawRounds : POMODORO_DEFAULT_ROUNDS;
  const textArr = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((t): t is string => typeof t === 'string' && t.trim() !== '') : [];
  const texts = textArr(r.texts);
  const breakTexts = textArr(r.breakTexts);
  return {
    enabled: true,
    intervalMin,
    breakMin,
    longBreakMin,
    roundsBeforeLongBreak,
    autoStartBreak: r.autoStartBreak !== false,
    autoStartFocus: r.autoStartFocus === true,
    texts: texts.length > 0 ? texts : POMODORO_DEFAULT_TEXTS,
    breakTexts: breakTexts.length > 0 ? breakTexts : POMODORO_DEFAULT_BREAK_TEXTS,
  };
}

/** 从配置里抽一句提醒；rand 可注入便于单测 */
export function pickPomodoroText(cfg: PomodoroConfig, rand: () => number = Math.random): string {
  const texts = cfg.texts.length > 0 ? cfg.texts : POMODORO_DEFAULT_TEXTS;
  return texts[Math.min(texts.length - 1, Math.floor(rand() * texts.length))];
}

/** 从配置里抽一句「休息结束」提醒。 */
export function pickBreakText(cfg: PomodoroConfig, rand: () => number = Math.random): string {
  const texts = cfg.breakTexts.length > 0 ? cfg.breakTexts : POMODORO_DEFAULT_BREAK_TEXTS;
  return texts[Math.min(texts.length - 1, Math.floor(rand() * texts.length))];
}

/** 间隔分钟 → 毫秒（定时器用）；至少 1 分钟 */
export function pomodoroMs(cfg: PomodoroConfig): number {
  return Math.max(POMODORO_MIN_INTERVAL_MIN, cfg.intervalMin) * 60 * 1000;
}
