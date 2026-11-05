/**
 * 心情 / 亲密度（浏览器端）：localStorage 持久化 + 摸它涨 + 久不理随时间衰减。
 *
 * 与桌面端 runtime/electron-helper/sprite/mood.js 同一套语义与存储键：
 * 纯算法在 shared/mood.ts，本模块只负责「读存 + 定时衰减 + 接到点击台词 / 作息」。
 * 心情值按宠物实例（petId）单独存；两端各自用 localStorage，互不覆盖。
 * @module dsh-zdd-pet/src/client/pet/card/mood
 */
import { clampMood, displayMood, moodLabel, moodTextPool, moodTier, readMoodParams } from '../../../shared/mood.ts';
import {
  intimacyRank,
  intimacyStageOf,
  intimacyTextPool,
  intimacyTierOf,
  readIntimacyParams,
} from '../../../shared/intimacy.ts';
import type { IntimacyParams, IntimacyTier } from '../../../shared/intimacy.ts';
import type { MoodParams } from '../../../shared/types.ts';
import type { MoodTier } from '../../../shared/mood.ts';
import { decayAffection, touchAffection } from '../../../shared/affection-state.ts';
import type { AffectionState } from '../../../shared/affection-state.ts';
import { loadAffection, saveAffection } from '../../../shared/affection-storage.ts';
import type { AffectionStorage } from '../../../shared/affection-storage.ts';
import type { RuntimePet } from '../types.ts';
import type * as ReactNS from 'react';

/** 定时衰减检查间隔（ms）：1 分钟足够，heartbeat 开销可忽略。 */
const DECAY_TICK_MS = 60_000;

/** 心情点满时的彩蛋动画（与桌面端 triggerExcite 同一段）。 */
export const MOOD_EXCITE_ANIM = '原地冲刺跑';

/** 彩蛋兜底时长（ms）：动画异常没走完时也强制结算，避免卡在 100 点不动。 */
export const MOOD_EXCITE_SAFETY_MS = 9_000;

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
  /** 本次是否跨过亲密度阶段边界（调用方播「阶段解锁」气泡）；未启用亲密度时恒为 false。 */
  promoted: boolean;
  /** 升级前的阶段（promoted 时才用于对比，否则 undefined）。 */
  promotedFrom?: IntimacyTier;
  /** 升级后的阶段（promoted 时有效）。 */
  promotedTo?: IntimacyTier;
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
  /** 亲密度：是否启用。 */
  intimacyEnabled(): boolean;
  /** 亲密度：当前阶段。 */
  intimacyTier(): IntimacyTier;
  /** 亲密度：阶段中文名（形如「亲近」）。 */
  intimacyLabel(): string;
  /** 亲密度：按当前阶段取专属台词池，空则回退传入兜底池。 */
  intimacyTexts(fallback: readonly string[]): readonly string[];
  /** 摸一下：涨 touchGain（或指定值），返回是否点满、是否升级。 */
  touch(gain?: number): MoodTouchResult;
  /** 彩蛋收尾：随机掉到 61~99，返回新值。 */
  finishExcite(): number;
}

/** 存储访问可能被浏览器策略拒绝，此时保留会话内状态。 */
function storage(): AffectionStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

/**
 * 制造心情驱动的 hook。
 *
 * @param rt - 注入的 react 能力。
 * @returns 接收配置 ref 的 hook，返回心情读写面。
 */
export function createCardMood(rt: CardMoodRuntime) {
  const { useState, useEffect, useRef } = rt;

  return function useCardMood(input: CardMoodInput): CardMood {
    const petId = input.cfgRef.current.id;
    const params = (): MoodParams => readMoodParams(input.cfgRef.current.mood);
    const intimacyParams = (): IntimacyParams => readIntimacyParams(input.cfgRef.current.intimacy);

    const stateRef = useRef<AffectionState | null>(null);
    if (!stateRef.current) {
      const current = params();
      const now = Date.now();
      const stored = loadAffection(storage(), petId, current.initial, now);
      stateRef.current = current.enabled
        ? decayAffection(stored, now, current.decayPerHour)
        : { ...stored, savedAt: now };
      saveAffection(storage(), petId, stateRef.current);
    }
    const [, setValue] = useState<number>(stateRef.current.mood);
    const valueRef = useRef(stateRef.current.mood);
    const excitedRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    const commit = (next: AffectionState): void => {
      stateRef.current = next;
      valueRef.current = next.mood;
      setValue(next.mood);
      saveAffection(storage(), petId, next);
    };

    // 定时衰减：按「距上次保存」的时长补算，避免 interval 抖动累积误差。
    useEffect(() => {
      const id = window.setInterval(() => {
        const p = params();
        if (!p.enabled) return;
        const now = Date.now();
        commit(decayAffection(stateRef.current!, now, p.decayPerHour));
      }, DECAY_TICK_MS);
      return () => {
        window.clearInterval(id);
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
      // petId / params 都从稳定的 ref 现取，挂一次即可。
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tier = (): MoodTier => {
      const p = params();
      return moodTier(valueRef.current, p.low, p.high);
    };

    const touch = (gain?: number): MoodTouchResult => {
      const p = params();
      if (!p.enabled) return { value: valueRef.current, tier: 'normal', hitMax: false, promoted: false };
      const ip = intimacyParams();
      const prevTier = intimacyTierOf(stateRef.current!.intimacy);
      const g = Number.isFinite(gain) ? (gain as number) : p.touchGain;
      const touched = touchAffection(decayAffection(stateRef.current!, Date.now(), p.decayPerHour), g);
      const next = touched.mood;
      commit(touched);
      const hitMax = next >= 100 && !excitedRef.current;
      if (hitMax) excitedRef.current = true;
      // 亲密度阶段是否升级（仅启用时检查；stranger 为起始态不会触发）。
      let promoted = false;
      let promotedTo: IntimacyTier | undefined;
      if (ip.enabled) {
        const nextTier = intimacyTierOf(touched.intimacy);
        if (intimacyRank(nextTier) > intimacyRank(prevTier)) {
          promoted = true;
          promotedTo = nextTier;
        }
      }
      return {
        value: next,
        tier: moodTier(next, p.low, p.high),
        hitMax,
        promoted,
        ...(promoted ? { promotedFrom: prevTier, promotedTo } : {}),
      };
    };

    const finishExcite = (): number => {
      if (!excitedRef.current) return valueRef.current;
      excitedRef.current = false;
      // 从满值掉 1~39 点 → 61~99，恒大于 60（与桌面端一致）。
      commit({ ...stateRef.current!, mood: clampMood(61 + Math.floor(Math.random() * 39)), savedAt: Date.now() });
      return valueRef.current;
    };

    return {
      params,
      enabled: () => params().enabled,
      value: () => valueRef.current,
      tier,
      label: () => {
        const v = displayMood(valueRef.current);
        return '心情 ' + v + '/100（' + moodLabel(tier()) + '）';
      },
      texts: (fallback) => {
        const p = params();
        return moodTextPool(p, moodTier(valueRef.current, p.low, p.high), fallback);
      },
      intimacyEnabled: () => intimacyParams().enabled,
      intimacyTier: () => intimacyTierOf(stateRef.current!.intimacy),
      intimacyLabel: () => {
        const ip = intimacyParams();
        return intimacyStageOf(ip, intimacyTierOf(stateRef.current!.intimacy)).label;
      },
      intimacyTexts: (fallback) => {
        const ip = intimacyParams();
        return intimacyTextPool(ip, intimacyTierOf(stateRef.current!.intimacy), fallback);
      },
      touch,
      finishExcite,
    };
  };
}
