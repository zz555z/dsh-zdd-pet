/**
 * 宠物作息（浏览器端驱动）：空闲久了打瞌睡、有交互时醒来。
 *
 * 与桌面端 sprite 的 checkRest/rememberActivity 同一套语义：以「最近一次交互时刻」为基准，
 * 空闲超过 rest.sleepAfterSec 秒 → 播 rest.sleepAnim（循环）；一旦 poke()（点击/说话/工作状态变化）
 * → 播 rest.wakeAnim 醒来。动画名来自条目级 rest 配置（flattenConfigPets 已吹入每只实例）。
 * 不接管随机动画链：睡眠用循环播、醒来播一遍后由 ended 判定接回链，与既有编排不冲突。
 * @module dsh-zdd-pet/src/client/pet/card/rest
 */
import type * as ReactNS from 'react';

/** 注入的 react 能力。 */
export interface CardRestRuntime {
  useEffect: (effect: ReactNS.EffectCallback, deps?: ReactNS.DependencyList) => void;
  useRef: <T>(initial: T) => ReactNS.MutableRefObject<T>;
}

/** 作息驱动需要的输入。 */
export interface CardRestInput {
  /** 当前宠物配置（含 rest 段）。 */
  cfgRef: ReactNS.MutableRefObject<{
    rest?: { enabled?: boolean; sleepAfterSec?: number; sleepAnim?: string; wakeAnim?: string };
  }>;
  /** 动画控制。 */
  actions: {
    setAnim: (anim: string) => void;
    setOnce: (on: boolean) => void;
    bumpSeq: () => void;
  };
}

/** 作息驱动对外的读写面。 */
export interface CardRest {
  /** 记一次活动：刷新空闲计时；若在瞌睡则播醒来动画。 */
  poke: () => void;
}

/** 空闲检查间隔（ms）：15s 一次足够，开销可忽略。 */
const CHECK_INTERVAL_MS = 15000;

/**
 * 造作息驱动。
 * @param rt - 注入的 react 能力。
 * @returns 接收配置与动画控制的 hook，返回 poke。
 */
export function createCardRest(rt: CardRestRuntime) {
  const { useEffect, useRef } = rt;

  return function useCardRest(input: CardRestInput): CardRest {
    const sleepingRef = useRef(false);
    const lastRef = useRef(Date.now());

    useEffect(() => {
      const id = window.setInterval(() => {
        const r = input.cfgRef.current.rest;
        if (!r || r.enabled === false || sleepingRef.current) return;
        const sec = Number(r.sleepAfterSec);
        if (!Number.isFinite(sec) || sec <= 0) return;
        if (Date.now() - lastRef.current < sec * 1000) return;
        const anim = typeof r.sleepAnim === 'string' && r.sleepAnim ? r.sleepAnim : '';
        if (!anim) return;
        sleepingRef.current = true;
        input.actions.setAnim(anim);
        input.actions.setOnce(false); // 循环打盹
        input.actions.bumpSeq();
      }, CHECK_INTERVAL_MS);
      return () => window.clearInterval(id);
      // cfgRef/actions 都是稳定引用，只需挂一次
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const poke = (): void => {
      lastRef.current = Date.now();
      if (!sleepingRef.current) return;
      sleepingRef.current = false;
      const r = input.cfgRef.current.rest;
      const wake = r && typeof r.wakeAnim === 'string' ? r.wakeAnim : '';
      if (wake) {
        input.actions.setAnim(wake);
        input.actions.setOnce(true); // 播一遍，ended 后回随机链
        input.actions.bumpSeq();
      }
    };

    return { poke };
  };
}
