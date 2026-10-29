/**
 * 余额告急搞怪演出 —— 用量快耗尽时，让桌宠跳出来演一段。
 *
 * 口径提醒：balancePercent 是**已用百分比**（0 = 没用过，100 = 用光），
 * 所以"余额低于 10%" = percent ≥ 90。别把方向搞反。
 *
 * 防刷屏是这里的核心（用户选的是"只弹一次"）：
 *   ① 阈值：只有跨过 threshold 才触发，没跨过无论如何不弹；
 *   ② 冷却：触发后 cooldownMs 内不再触发（默认 1 小时）；
 *   ③ 回落重置：百分比掉回阈值以下（额度重置/换服务商）→ 清掉冷却，下次耗尽还能再提醒。
 * 状态是内存态（进程内），重启即清空——够用，不必落盘。
 */
export interface BalanceGagConfig {
    enabled: boolean;
    /** 已用百分比阈值（≥ 此值视为告急）；0~100 */
    thresholdPercent: number;
    /** 冷却毫秒 */
    cooldownMs: number;
    texts: string[];
    /** 配图（表情包池内的名字）；空则纯文字 */
    images: string[];
}
export declare const BALANCE_GAG_DEFAULT_THRESHOLD = 90;
export declare const BALANCE_GAG_DEFAULT_COOLDOWN_MS: number;
export declare const BALANCE_GAG_DEFAULT_TEXTS: string[];
export declare const BALANCE_GAG_DEFAULT_IMAGES: string[];
/** 解析配置；enabled 不显式 true → undefined（默认关闭） */
export declare function parseBalanceGag(raw: unknown): BalanceGagConfig | undefined;
/** 额度告急的内存态：上次触发时点 + 是否已处于"告急态"（用于回落重置） */
export interface BalanceGagState {
    lastFireAt: number;
    armed: boolean;
}
export declare function newBalanceGagState(): BalanceGagState;
/**
 * 一次采样 → 是否该演。
 * @param percent 已用百分比（0~100；undefined = 给不出，跳过）
 * @param now 当前时间戳（可注入，便于单测）
 * @returns 该演则返回 true，并把 state 推进（lastFireAt=now、armed=true）
 */
export declare function shouldFireBalanceGag(cfg: BalanceGagConfig, state: BalanceGagState, percent: number | undefined, now: number): boolean;
/** 抽一条演出（文案 + 可选图）；rand 可注入 */
export declare function pickBalanceGag(cfg: BalanceGagConfig, rand?: () => number): {
    text: string;
    image?: string;
};
