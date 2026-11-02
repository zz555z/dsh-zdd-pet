/**
 * 随机小事件的纯逻辑（浏览器与桌面端共用）。
 *
 * 「不靠触发也有生命力」：空闲时每隔一段随机时间，让桌宠自己做个动作（伸懒腰、看窗外、打哈欠…），
 * 偶尔配一句拟声/短句。事件池来自配置，抽签算法在这里，定时与播放由两端各自实现。
 *
 * 只做数据形状、默认值与抽取，不碰 DOM / 定时器。
 * @module dsh-zdd-pet/src/shared/idle-events
 */
/** 一个随机小事件。 */
export interface IdleEvent {
    /** 要播的动画名（须在本宠物动画池里存在，否则两端会跳过） */
    anim: string;
    /** 可选气泡文案（空 = 只播动画不说） */
    text?: string;
}
/** config.jsonc 的 idleEvents 段。 */
export interface IdleEventsParams {
    /** 是否启用随机小事件 */
    enabled: boolean;
    /** 两次事件之间的最短间隔（秒） */
    minGapSec: number;
    /** 两次事件之间的最长间隔（秒） */
    maxGapSec: number;
    /** 事件池 */
    events: IdleEvent[];
}
/** 间隔上下限（秒）：下界 20，上界 1 天。 */
export declare const IDLE_GAP_MIN_SEC = 20;
export declare const IDLE_GAP_MAX_SEC: number;
/** 内置默认（与 assets/config.jsonc 的 idleEvents 段保持一致）。 */
export declare const DEFAULT_IDLE_EVENTS: IdleEventsParams;
/** 抽签：从非空事件池里随机抽一个，尽量避开当前正播动画（能避开就别播同一段）。 */
export declare function pickIdleEvent(pool: readonly IdleEvent[], currentAnim?: string): IdleEvent | undefined;
/** [min,max] 之间取一个毫秒间隔（顺序颠倒则交换；非法回退默认）。 */
export declare function randomIdleGapMs(params: IdleEventsParams): number;
/** 解析 config 的 idleEvents 段；缺失/非法 → 默认值。 */
export declare function readIdleEventsParams(raw: unknown): IdleEventsParams;
/**
 * idleEvents 段校验：enabled 布尔；minGapSec / maxGapSec 若出现须在 [20, 86400]；
 * events 若出现必须是数组（坏条目由读取侧过滤，不整体判非法）。
 */
export declare function idleEventsValid(value: unknown): boolean;
