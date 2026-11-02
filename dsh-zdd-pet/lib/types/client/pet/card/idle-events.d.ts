import type { IdleEventsParams } from '../../../shared/idle-events.ts';
import type * as ReactNS from 'react';
/** 注入的 react 能力。 */
export interface CardIdleEventsRuntime {
    useEffect: (effect: ReactNS.EffectCallback, deps?: ReactNS.DependencyList) => void;
    useRef: <T>(initial: T) => ReactNS.MutableRefObject<T>;
}
/** 随机小事件驱动需要的输入。 */
export interface CardIdleEventsInput {
    /** 当前宠物配置（含 idleEvents 段）。 */
    cfgRef: ReactNS.MutableRefObject<{
        idleEvents?: IdleEventsParams;
        animations: unknown;
    }>;
    /** 动画名是否存在于本宠物动画池。 */
    hasAnim: (name: string) => boolean;
    /** 现在能不能自由播（不拖拽/未冻结/没在睡/工作状态空闲）。 */
    canPlay: () => boolean;
    /** 播一个一次性动作。 */
    playOnce: (name: string) => void;
    /** 说一句气泡（可选文案为空则不说）。 */
    say: (text: string) => void;
    /** 当前正在播的动画名（抽签避开）。 */
    currentAnim: () => string;
}
/** 随机小事件驱动对外读写面。 */
export interface CardIdleEvents {
    /** 手动立刻来一发（调试/菜单用；同样受 canPlay 约束）。 */
    fire: () => void;
}
/**
 * 造随机小事件驱动。内部用链式 setTimeout：每次触发后按配置重新随机一个间隔，避免固定周期。
 * @param rt - 注入的 react 能力。
 * @returns 接收输入的 hook，返回 fire。
 */
export declare function createCardIdleEvents(rt: CardIdleEventsRuntime): (input: CardIdleEventsInput) => CardIdleEvents;
