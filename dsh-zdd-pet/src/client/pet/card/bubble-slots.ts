/**
 * 气泡单槽：余额、说话、工作状态三种气泡的显隐、停留计时与优先级选择。
 * 不负责何时点亮与动画联动：tick 判定、抽动画、打日志都在 PetCard；也不负责外观，哑组件在 client/bubble.ts。
 * 依赖注入的 react 与两个气泡组件；三个停留计时器都归本模块清理。
 * 不变量：同一时刻只渲染一个气泡，优先级依次为终态任务、说话、余额、非终态任务。
 * @module dsh-zdd-pet/src/client/pet/card/bubble-slots
 */
import { customViews, type BalanceState } from '../../../shared/balance/index.ts';
import { BUBBLE_DURATION_MS, WORK_BUBBLE_MS } from '../timings.ts';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type * as ReactNS from 'react';
import type { jsx } from 'react/jsx-runtime';

/** 当前该挂哪个气泡；`none` 表示哪个条件都不成立。 */
export type BubbleSlot = 'work-terminal' | 'whisper' | 'balance' | 'work' | 'none';

/** 优先级判定的输入：全部是渲染期的既成事实，判定本身不产生副作用。 */
export interface BubbleSlotInput {
  /** 工作状态是否为终态（success / error）。 */
  workTerminal: boolean;
  /** 工作气泡是否点亮。 */
  workOn: boolean;
  /** 工作气泡文本。 */
  workText: string | null;
  /** 当前是否有任务详情/进度（有则进度气泡优先，碎碎念与余额让位）。 */
  workHasTask: boolean;
  /** 配置是否启用工作状态联动。 */
  workStatusEnabled: boolean;
  /** 说话气泡是否点亮。 */
  whisperOn: boolean;
  /** 说话气泡文本。 */
  whisperText: string | null;
  /** 说话气泡是否常驻（等待用户确认）：true 时优先级最高且不自动收起。 */
  whisperHold: boolean;
  /** 余额气泡是否点亮。 */
  balanceOn: boolean;
  /** 余额数据是否已拉到；null 表示尚未拉到。 */
  balanceAvailable: boolean;
  /** 配置是否启用余额。 */
  balanceEnabled: boolean;
  /** 本次余额是否手动请求；手动请求不受开关门控。 */
  balanceManual: boolean;
}

/**
 * 决定当前挂哪个气泡。
 *
 * 终态任务只活 10s，所以不让位；有任务（文案或清单进度）时进度气泡常驻，碎碎念与余额让它位
 * （否则碎碎念会顶掉用户正想看的「2/5」）；没任务时才轮到大吼/余额。
 *
 * @param input - 三种气泡的显隐与开关。
 * @returns 命中的槽位；都不成立时为 `none`。
 */
export function decideBubbleSlot(input: BubbleSlotInput): BubbleSlot {
  // 等待用户确认的常驻气泡拥有最高优先级：它必须一直在，直到用户确认后被宿主 clear，
  // 不能被任务进度、完成/失败、碎碎念或余额任何一方顶掉。
  if (input.whisperOn && input.whisperHold && input.whisperText) return 'whisper';
  if (input.workTerminal && input.workOn && input.workText && input.workStatusEnabled) return 'work-terminal';
  if (input.workOn && input.workHasTask && input.workStatusEnabled) return 'work';
  if (input.whisperOn && input.whisperText) return 'whisper';
  if (input.balanceOn && input.balanceAvailable && (input.balanceEnabled || input.balanceManual)) return 'balance';
  if (input.workOn && input.workText && input.workStatusEnabled) return 'work';
  return 'none';
}

/**
 * 余额气泡的可翻页数。
 *
 * custom 形态由第三方决定页数，windows 两页（收起与展开），其余形态点开没有新内容。
 *
 * @param balance - 最近一次余额结果。
 * @returns 页数，至少 1。
 */
export function balancePageCount(balance: BalanceState | null): number {
  if (!balance || !balance.ok) return 1;
  if (balance.shape === 'custom') return Math.max(1, customViews(balance)?.length ?? 1);
  return balance.shape === 'windows' ? 2 : 1;
}

/** 余额气泡组件；props 与 `client/bubble.ts` 的 BalanceBubble 一致。 */
export type BalanceBubbleComponent = (props: {
  state: BalanceState;
  on: boolean;
  index: number;
  onCycle: () => void;
}) => ReactNode;

/** 说话气泡组件；配图二选一，props 与 `client/bubble.ts` 的 WhisperBubble 一致。 */
export type WhisperBubbleComponent = (props: {
  text: string;
  image?: string;
  url?: string;
  assetRoot?: string;
  on: boolean;
}) => ReactNode;

/** 注入的 react 能力。 */
export interface BubbleSlotsRuntime {
  /** 创建元素。 */
  h: typeof jsx;
  /** 状态。 */
  useState: <T>(init: T) => [T, Dispatch<SetStateAction<T>>];
  /** 引用。 */
  useRef: <T>(initial: T) => ReactNS.MutableRefObject<T>;
  /** 副作用；用于卸载时清计时器。 */
  useEffect: (effect: ReactNS.EffectCallback, deps?: ReactNS.DependencyList) => void;
}

/** 两种气泡组件。 */
export interface BubbleComponents {
  /** 余额气泡。 */
  balanceBubble: BalanceBubbleComponent;
  /** 说话气泡。 */
  whisperBubble: WhisperBubbleComponent;
}

/** 每次渲染由 PetCard 提供的视图输入。 */
export interface BubbleSlotsInput {
  /** 最近一次余额结果。 */
  balance: BalanceState | null;
  /** 配置是否启用余额。 */
  balanceEnabled: boolean;
  /** 本次余额是否手动请求。 */
  balanceManual: boolean;
  /** 配置是否启用工作状态联动。 */
  workStatusEnabled: boolean;
  /** 工作状态是否处于终态。 */
  workTerminal: boolean;
  /** 当前是否有任务详情/进度（有则进度气泡优先，碎碎念/余额让位）。 */
  workHasTask: boolean;
  /** 任务进度角标文案（「▰▰▱▱▱  2/5」）；null = 无清单进度。 */
  workProgress: string | null;
  /** 说话气泡配图的素材根。 */
  assetRoot?: string;
}

/** 气泡单槽对外的读写面。 */
export interface BubbleSlots {
  /** 点亮余额气泡并回到第一页，重置停留计时。 */
  showBalance(): void;
  /** 点余额气泡翻页，并重置停留计时。 */
  cycleBalance(): void;
  /** 点亮说话气泡；duration 为 0 时不改动当前气泡，undefined 用默认时长。
   *  hold = true 表示常驻（等待用户确认），不吃 duration，且期间普通气泡一律不覆盖它。 */
  showWhisper(text: string, parts: { image?: string; url?: string }, duration?: number, hold?: boolean): void;
  /** 收起说话气泡；不碰动画与另两种气泡。 */
  clearWhisper(): void;
  /** 更新工作气泡文本，显隐不动。 */
  updateWorkText(text: string | null): void;
  /** 点亮工作气泡；terminal 决定 10s 后自动收起，非终态常驻。 */
  lightWork(terminal: boolean): void;
  /** 收起工作气泡但保留文本。 */
  hideWork(): void;
  /** 回空闲：收起工作气泡并清文本。 */
  resetWork(): void;
  /** 按优先级渲染当前该挂的气泡；无气泡时为 null。 */
  node(): ReactNode;
}

/**
 * 制造气泡单槽的 hook，每个 PetCard 调一次。
 *
 * @param rt - 注入的 react 能力。
 * @param components - 余额与说话气泡组件。
 * @returns 接收视图输入的 hook；钩子内部的状态与计时器随卡片卸载一并清理。
 */
export function createBubbleSlots(rt: BubbleSlotsRuntime, components: BubbleComponents) {
  const { h, useState, useRef, useEffect } = rt;
  const BalanceBubble = components.balanceBubble;
  const WhisperBubble = components.whisperBubble;

  return function useBubbleSlots(input: BubbleSlotsInput): BubbleSlots {
    // 余额气泡：显隐与展开页。
    const [balanceOn, setBalanceOn] = useState(false);
    const [balancePage, setBalancePage] = useState(0);
    const balanceTimerRef = useRef<number | null>(null);
    // 说话气泡：显隐、文本与配图（池内名与完整地址二选一）。
    const [whisperOn, setWhisperOn] = useState(false);
    const [whisperText, setWhisperText] = useState<string | null>(null);
    const [whisperImage, setWhisperImage] = useState<string | undefined>(undefined);
    const [whisperUrl, setWhisperUrl] = useState<string | undefined>(undefined);
    const [whisperHold, setWhisperHold] = useState(false);
    const whisperTimerRef = useRef<number | null>(null);
    // 常驻状态用 ref 判「要不要拒绝普通气泡」：同一拍里连续两次 showWhisper 时 state 还没刷新。
    const whisperHoldRef = useRef(false);
    // 工作状态气泡：显隐与文本。
    const [workOn, setWorkOn] = useState(false);
    const [workText, setWorkText] = useState<string | null>(null);
    const workTimerRef = useRef<number | null>(null);

    // 卸载后不再 setState：三个计时器都在这里清。
    useEffect(
      () => () => {
        if (balanceTimerRef.current !== null) window.clearTimeout(balanceTimerRef.current);
        if (whisperTimerRef.current !== null) window.clearTimeout(whisperTimerRef.current);
        if (workTimerRef.current !== null) window.clearTimeout(workTimerRef.current);
      },
      [],
    );

    /** 重置余额气泡的停留计时；重复触发先清旧定时器，否则旧的会提前收起。 */
    const armBalanceTimeout = () => {
      if (balanceTimerRef.current !== null) window.clearTimeout(balanceTimerRef.current);
      balanceTimerRef.current = window.setTimeout(() => setBalanceOn(false), BUBBLE_DURATION_MS);
    };

    const showBalance = () => {
      setBalancePage(0); // 新一轮查询从第一页开始。
      setBalanceOn(true);
      armBalanceTimeout();
    };

    const cycleBalance = () => {
      const pages = balancePageCount(input.balance);
      setBalancePage((page) => (page + 1) % pages);
      // 重新计时：第 8 秒点开才剩 2 秒，看不清下一页。
      armBalanceTimeout();
    };

    const showWhisper = (text: string, parts: { image?: string; url?: string }, duration?: number, hold = false) => {
      if (duration === 0) return; // 只联动动画、不改气泡时走这里。
      // 等待用户确认的常驻气泡期间，普通气泡（点击台词 / 碎碎念 / 对话回复）一律不覆盖它。
      if (whisperHoldRef.current && !hold) return;
      setWhisperText(text);
      setWhisperImage(parts.image);
      setWhisperUrl(parts.url);
      setWhisperHold(hold);
      whisperHoldRef.current = hold;
      setWhisperOn(true);
      if (whisperTimerRef.current !== null) window.clearTimeout(whisperTimerRef.current);
      // hold = 常驻：不吃 duration，直到宿主写 clear；普通气泡按原时长收起。
      whisperTimerRef.current = hold
        ? null
        : window.setTimeout(() => setWhisperOn(false), duration ?? BUBBLE_DURATION_MS);
    };

    const clearWhisper = () => {
      if (whisperTimerRef.current !== null) window.clearTimeout(whisperTimerRef.current);
      whisperTimerRef.current = null;
      whisperHoldRef.current = false;
      setWhisperHold(false);
      setWhisperOn(false);
      setWhisperText(null);
      setWhisperImage(undefined);
    };

    const lightWork = (terminal: boolean) => {
      setWorkOn(true);
      if (workTimerRef.current !== null) window.clearTimeout(workTimerRef.current);
      // 终态 10s；非终态 15s 后自动收起（新一轮/任务详情变化再点亮），与桌面端同一口径。
      workTimerRef.current = window.setTimeout(() => setWorkOn(false), terminal ? BUBBLE_DURATION_MS : WORK_BUBBLE_MS);
    };

    const hideWork = () => {
      if (workTimerRef.current !== null) window.clearTimeout(workTimerRef.current);
      workTimerRef.current = null;
      setWorkOn(false);
    };

    const resetWork = () => {
      hideWork();
      setWorkText(null);
    };

    const node = (): ReactNode => {
      const slot = decideBubbleSlot({
        workTerminal: input.workTerminal,
        workOn,
        workText,
        workHasTask: input.workHasTask,
        workStatusEnabled: input.workStatusEnabled,
        whisperOn,
        whisperText,
        whisperHold,
        balanceOn,
        balanceAvailable: input.balance !== null,
        balanceEnabled: input.balanceEnabled,
        balanceManual: input.balanceManual,
      });
      if (slot === 'balance') {
        return input.balance === null
          ? null
          : h(BalanceBubble, { state: input.balance, on: balanceOn, index: balancePage, onCycle: cycleBalance });
      }
      if (slot === 'whisper') {
        return whisperText === null
          ? null
          : h(WhisperBubble, {
              text: whisperText,
              image: whisperImage,
              url: whisperUrl,
              assetRoot: input.assetRoot,
              on: whisperOn,
            });
      }
      // 终态与非终态共用同一个组件，差别只在停留时长与优先级；工作气泡带任务进度角标。
      if (slot === 'work' || slot === 'work-terminal') {
        return workText === null
          ? null
          : h(WhisperBubble, { text: workText, progress: input.workProgress, on: workOn });
      }
      return null;
    };

    return {
      clearWhisper,
      cycleBalance,
      hideWork,
      lightWork,
      node,
      resetWork,
      showBalance,
      showWhisper,
      updateWorkText: setWorkText,
    };
  };
}
