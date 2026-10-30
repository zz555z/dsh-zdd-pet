/**
 * 心情 / 亲密度（浏览器端）：localStorage 持久化 + 摸它涨 + 久不理随时间衰减。
 *
 * 与桌面端 runtime/electron-helper/sprite/mood.js 同一套语义与存储键：
 * 纯算法在 shared/mood.ts，本模块只负责「读存 + 定时衰减 + 接到点击台词 / 作息」。
 * 心情值按宠物实例（petId）单独存；两端各自用 localStorage，互不覆盖。
 * @module dsh-zdd-pet/src/client/pet/card/mood
 */
import { clampMood, decayMood, moodLabel, moodTextPool, moodTier, readMoodParams } from '../../../shared/mood.ts';
import type { MoodParams } from '../../../shared/types.ts';
import type { MoodTier } from '../../../shared/mood.ts';
import type { RuntimePet } from '../types.ts';
import type * as ReactNS from 'react';

/** localStorage 键前缀：与桌面端 sprite/mood.js 保持一致（同一只宠物同一把键）。 */
const MOOD_KEY_PREFIX = 'dsh-zdd-pet-mood-';

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

/** 从 localStorage 读一次；坏数据 / 无存储 → 初始值。 */
function readStored(petId: string, params: MoodParams): { value: number; savedAt: number } {
  const fallback = { value: clampMood(params.initial), savedAt: Date.now() };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(MOOD_KEY_PREFIX + petId);
    if (!raw) return fallback;
    const o = JSON.parse(raw) as { v?: unknown; t?: unknown };
    const value = Number(o.v);
    const savedAt = Number(o.t);
    if (!Number.isFinite(value)) return fallback;
    return { value: clampMood(value), savedAt: Number.isFinite(savedAt) ? savedAt : Date.now() };
  } catch {
    return fallback;
  }
}

/** 写回 localStorage；存不了就只在本会话内生效（与桌面端同一处理）。 */
function writeStored(petId: string, value: number, savedAt: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MOOD_KEY_PREFIX + petId, JSON.stringify({ v: clampMood(value), t: savedAt }));
  } catch {
    /* 存不了就算了，本会话内仍有效 */
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

    // 初始值同步从 localStorage 读，避免首帧先显示初始值再跳。
    // 注入的 useState 只接受值、不支持惰性初始化函数，所以先算再传（只在本卡首次渲染执行有意义）。
    const initialValue = ((): number => {
      const p = params();
      if (!p.enabled) return clampMood(p.initial);
      const stored = readStored(petId, p);
      // 启动时按距上次保存的时长补算衰减（跨重启也生效）。
      return decayMood(stored.value, Date.now() - stored.savedAt, p.decayPerHour);
    })();
    const [value, setValue] = useState<number>(initialValue);
    const valueRef = useRef(value);
    valueRef.current = value;
    const savedAtRef = useRef(Date.now());
    const excitedRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    const commit = (next: number): void => {
      const v = clampMood(next);
      valueRef.current = v;
      savedAtRef.current = Date.now();
      setValue(v);
      writeStored(petId, v, savedAtRef.current);
    };

    // 定时衰减：按「距上次保存」的时长补算，避免 interval 抖动累积误差。
    useEffect(() => {
      const id = window.setInterval(() => {
        const p = params();
        if (!p.enabled) return;
        const now = Date.now();
        commit(decayMood(valueRef.current, now - savedAtRef.current, p.decayPerHour));
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
      if (!p.enabled) return { value: valueRef.current, tier: 'normal', hitMax: false };
      const g = Number.isFinite(gain) ? (gain as number) : p.touchGain;
      const next = clampMood(valueRef.current + g);
      commit(next);
      const hitMax = next >= 100 && !excitedRef.current;
      if (hitMax) excitedRef.current = true;
      return { value: next, tier: moodTier(next, p.low, p.high), hitMax };
    };

    const finishExcite = (): number => {
      if (!excitedRef.current) return valueRef.current;
      excitedRef.current = false;
      // 从满值掉 1~39 点 → 61~99，恒大于 60（与桌面端一致）。
      commit(61 + Math.floor(Math.random() * 39));
      return valueRef.current;
    };

    return {
      params,
      enabled: () => params().enabled,
      value: () => valueRef.current,
      tier,
      label: () => {
        const v = clampMood(valueRef.current);
        return '心情 ' + v + '/100（' + moodLabel(tier()) + '）';
      },
      texts: (fallback) => {
        const p = params();
        return moodTextPool(p, moodTier(valueRef.current, p.low, p.high), fallback);
      },
      touch,
      finishExcite,
    };
  };
}
