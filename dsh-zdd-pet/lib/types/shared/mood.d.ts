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
export declare const MOOD_MIN = 0;
export declare const MOOD_MAX = 100;
/** 内置默认心情参数（与 assets/config.jsonc 的 mood 段保持一致，改一处须同步另一处）。 */
export declare const DEFAULT_MOOD: MoodParams;
/** 把心情夹到 0~100 的整数。 */
export declare function clampMood(v: number): number;
/** 心情档位。 */
export type MoodTier = 'low' | 'normal' | 'high';
/** 由数值与阈值判档位：< low 低落、> high 开心、其余平常。 */
export declare function moodTier(value: number, low: number, high: number): MoodTier;
/**
 * 按经过的毫秒数衰减心情：每小时掉 decayPerHour 点。
 *
 * @param value - 上次保存的心情。
 * @param elapsedMs - 距上次更新的毫秒（<=0 视为不衰减）。
 * @param decayPerHour - 每小时衰减点数（<=0 不衰减）。
 * @returns 衰减后的心情（夹在 0~100）。
 */
export declare function decayMood(value: number, elapsedMs: number, decayPerHour: number): number;
/** 心情档位的中文标签（气泡提示用）。 */
export declare function moodLabel(tier: MoodTier): string;
/**
 * 点击台词池：优先该档位的 mood.texts[档位]，为空则回退传入的 clickTexts。
 *
 * 与桌面端 `sayClickText` 同一口径；关闭心情系统时同样回退 clickTexts。
 *
 * @param params - 心情参数（含开关与台词池）。
 * @param tier - 当前档位。
 * @param fallback - clickTexts 兜底池。
 * @returns 可直接随机抽的字符串数组（至少是空数组）。
 */
export declare function moodTextPool(params: MoodParams, tier: MoodTier, fallback?: readonly string[]): readonly string[];
/**
 * mood 段校验：enabled 必须是布尔；initial/touchGain/decayPerHour/low/high 若出现，必须是 0~100
 * 的有限数字（缺省合法——手改配置可只写一部分，读取侧逐项回填默认值）。
 *
 * texts / happyAnim / sadAnim 不参与校验——它们由 readMoodParams 逐项过滤，设置页保存时也从 existing 透传保留。
 */
export declare function moodValid(value: unknown): boolean;
/** 解析 config 的 mood 段；非法/缺失 → 用默认值。 */
export declare function readMoodParams(raw: unknown): MoodParams;
