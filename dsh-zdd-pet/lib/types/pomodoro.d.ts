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
import { POMODORO_DEFAULT_INTERVAL_MIN, POMODORO_MAX_INTERVAL_MIN, POMODORO_MIN_INTERVAL_MIN } from '../shared/pomodoro.ts';
export interface PomodoroConfig {
    enabled: boolean;
    /** 间隔分钟；>0 的有限数，否则回落到默认 50 */
    intervalMin: number;
    texts: string[];
}
export { POMODORO_DEFAULT_INTERVAL_MIN, POMODORO_MAX_INTERVAL_MIN, POMODORO_MIN_INTERVAL_MIN };
/** 默认文案（不配 texts 时用） */
export declare const POMODORO_DEFAULT_TEXTS: string[];
/**
 * 解析配置 → 生效值；未配置/关闭 → undefined（= 不起定时器）。
 * 间隔非法一律回落默认（不告警，这是"锦上添花"功能，配置写坏了不该报错打扰）。
 */
export declare function parsePomodoro(raw: unknown): PomodoroConfig | undefined;
/** 从配置里抽一句提醒；rand 可注入便于单测 */
export declare function pickPomodoroText(cfg: PomodoroConfig, rand?: () => number): string;
/** 间隔分钟 → 毫秒（定时器用）；至少 1 分钟 */
export declare function pomodoroMs(cfg: PomodoroConfig): number;
