/**
 * 随机小事件（浏览器端驱动）：空闲时每隔一段随机时间自己做个动作，偶尔配一句气泡。
 *
 * 与「作息打盹」互补：打盹是长空闲后沉眠，小事件是活着的表现（伸懒腰/张望/打哈欠）。
 * 只在「不忙」时才触发：不拖拽、未冻结、没在睡、工作状态非进行中——任一条件不满足就顺延。
 * 事件池与抽签算法在 shared/idle-events.ts，本模块只管「何时抽、怎么播」。
 * @module dsh-zdd-pet/src/client/pet/card/idle-events
 */
import { pickIdleEvent, randomIdleGapMs, readIdleEventsParams } from '../../../shared/idle-events.ts';
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
  cfgRef: ReactNS.MutableRefObject<{ idleEvents?: IdleEventsParams; animations: unknown }>;
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
export function createCardIdleEvents(rt: CardIdleEventsRuntime) {
  const { useEffect, useRef } = rt;

  return function useCardIdleEvents(input: CardIdleEventsInput): CardIdleEvents {
    const timerRef = useRef<number | null>(null);

    const fire = (): void => {
      if (!input.canPlay()) return;
      const params = readIdleEventsParams(input.cfgRef.current.idleEvents);
      if (!params.enabled || params.events.length === 0) return;
      const ev = pickIdleEvent(params.events, input.currentAnim());
      if (!ev || !input.hasAnim(ev.anim)) return;
      input.playOnce(ev.anim);
      if (ev.text) input.say(ev.text);
    };

    useEffect(() => {
      const schedule = (): void => {
        const params = readIdleEventsParams(input.cfgRef.current.idleEvents);
        if (!params.enabled) {
          // 关闭：5s 后复查，等待可能重新开启。
          timerRef.current = window.setTimeout(schedule, 5000);
          return;
        }
        const gap = randomIdleGapMs(params);
        timerRef.current = window.setTimeout(() => {
          fire();
          schedule();
        }, gap);
      };
      schedule();
      return () => {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
      // cfgRef/input 都稳定，挂一次即可；fire 读实时 ref。
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { fire };
  };
}
