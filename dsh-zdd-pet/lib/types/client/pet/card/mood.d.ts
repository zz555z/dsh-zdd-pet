import type { MoodParams } from '../../../shared/types.ts';
import type { MoodTier } from '../../../shared/mood.ts';
import type { RuntimePet } from '../types.ts';
import type * as ReactNS from 'react';
/** 心情点满时的彩蛋动画（与桌面端 triggerExcite 同一段）。 */
export declare const MOOD_EXCITE_ANIM = "\u539F\u5730\u51B2\u523A\u8DD1";
/** 彩蛋兜底时长（ms）：动画异常没走完时也强制结算，避免卡在 100 点不动。 */
export declare const MOOD_EXCITE_SAFETY_MS = 9000;
/** 注入的 react 能力。 */
export interface CardMoodRuntime {
    useState: <T>(init: T) => [T, ReactNS.Dispatch<ReactNS.SetStateAction<T>>];
    useEffect: (effect: ReactNS.EffectCallback, deps?: ReactNS.DependencyList) => void;
    useRef: <T>(initial: T) => ReactNS.MutableRefObject<T>;
}
/** 心情驱动需要的最小输入。 */
export interface CardMoodInput {
    /** 当前宠物配置（含 mood 段与 id）。 */
    cfgRef: ReactNS.MutableRefObject<RuntimePet>;
}
/** 一次「摸它」的结果。 */
export interface MoodTouchResult {
    /** 摸完后的数值。 */
    value: number;
    /** 摸完后的档位。 */
    tier: MoodTier;
    /** 本次是否刚好点满（调用方据此播彩蛋动画）。 */
    hitMax: boolean;
}
/** 心情驱动对外的读写面。 */
export interface CardMood {
    /** 当前生效参数。 */
    params(): MoodParams;
    /** 是否启用。 */
    enabled(): boolean;
    /** 当前数值。 */
    value(): number;
    /** 当前档位。 */
    tier(): MoodTier;
    /** 形如「心情 72/100（还不错）」的展示文案。 */
    label(): string;
    /** 按档位取点击台词池，空则回退 clickTexts。 */
    texts(fallback: readonly string[]): readonly string[];
    /** 摸一下：涨 touchGain（或指定值），返回是否点满。 */
    touch(gain?: number): MoodTouchResult;
    /** 彩蛋收尾：随机掉到 61~99，返回新值。 */
    finishExcite(): number;
}
/**
 * 制造心情驱动的 hook。
 *
 * @param rt - 注入的 react 能力。
 * @returns 接收配置 ref 的 hook，返回心情读写面。
 */
export declare function createCardMood(rt: CardMoodRuntime): (input: CardMoodInput) => CardMood;
