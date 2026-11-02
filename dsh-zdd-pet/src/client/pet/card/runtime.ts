/**
 * 一张宠物卡的装配根：按固定顺序创建驱动与 hook，再把当帧能力拼成视图输入。
 * 只做接线：不判定（判定在 shared 与各驱动）、不渲染（DOM 在 card-view）、不持有跨卡状态。
 * 装配顺序不能改：动画链早于运动（回调要读走位）、运动早于拖拽（拖拽读飞行）、浮层最后。
 * 必须在渲染期填池：迟绑槽里的驱动实例只在本次渲染内赋值，别处不得写入。
 * @module dsh-zdd-pet/src/client/pet/card/runtime
 */
import { pick } from '../../../shared/pickers.ts';
import { postAction } from '../../../shared/state.ts';
import { spawnScoreBurst } from '../../../shared/score-popup.ts';
import { ROUTE_PATH } from '../../../shared/constants.ts';
import { resolveFontPx } from '../../../shared/fonts.ts';
import { hasTask, progressText } from '../../../shared/work-status.ts';
import { makeBalanceBubble, makeWhisperBubble } from '../../bubble.ts';
import { petBridge } from '../../settings.ts';
import { createMenuActions, type MenuActions } from '../menu-actions.ts';
import { derivePetMetrics, petRootStyle, petStageStyle } from '../motion/geometry.ts';
import { makePlaybackReporter } from '../playback-report.ts';
import { createAnimationFlow } from './animation-flow.ts';
import { createBubbleSlots } from './bubble-slots.ts';
import { createCardAnimation } from './animation.ts';
import { createCardDrag } from './drag.ts';
import { createCardMood, MOOD_EXCITE_ANIM, MOOD_EXCITE_SAFETY_MS } from './mood.ts';
import { intimacyStageOf, readIntimacyParams } from '../../../shared/intimacy.ts';
import type { IntimacyTier } from '../../../shared/intimacy.ts';
import { createCardRest } from './rest.ts';
import { createCardIdleEvents } from './idle-events.ts';
import { createCardEntry, type CardEntry } from './entry.ts';
import { createCardMotion } from './motion.ts';
import { createCardState } from './state.ts';
import { createCueEffects } from './cue-effects.ts';
import { createLockFreeze } from './lock-freeze.ts';
import type { CardHub } from './hub.ts';
import type { CardLive } from './live.ts';
import type { CardViewProps } from './view.ts';
import type { PetCardProps } from './props.ts';
import type { PetRuntime } from '../types.ts';

/** 动画名是否存在于任意动画池（防止播一个不存在的名字导致 404 卡住）。 */
function animExists(anims: unknown, target: string): boolean {
  const seen = new Set<unknown>();
  const stack: unknown[] = [anims];
  while (stack.length) {
    const o = stack.pop();
    if (!o || seen.has(o)) continue;
    if (typeof o === 'string') {
      if (o === target) return true;
      continue;
    }
    if (Array.isArray(o)) {
      for (const x of o) stack.push(x);
      continue;
    }
    if (typeof o === 'object') {
      seen.add(o);
      for (const v of Object.values(o as Record<string, unknown>)) stack.push(v);
    }
  }
  return false;
}

/**
 * 造卡片装配根的工厂：组件级单例（气泡、状态、指令、动画流）都在这里建一次。
 *
 * @param rt - 注入的 react 能力。
 * @returns 接收容器 props 的 hook，返回交给 card-view 的渲染输入。
 */
export function createCardRuntime(rt: PetRuntime) {
  const { h, useEffect, useRef, useState } = rt;
  /** 余额气泡：数据与显隐由装配根传入。 */
  const BalanceBubble = makeBalanceBubble({ h, useState, useEffect });
  /** 碎碎念气泡：文本与显隐由装配根传入。 */
  const WhisperBubble = makeWhisperBubble({ h });
  /** 三种气泡的单槽：显隐、停留计时与优先级都在这里。 */
  const useBubbleSlots = createBubbleSlots(
    { h, useState, useEffect, useRef },
    { balanceBubble: BalanceBubble, whisperBubble: WhisperBubble },
  );
  const useCardState = createCardState({ useState, useRef });
  const useCardMood = createCardMood({ useState, useEffect, useRef });
  const useLockFreeze = createLockFreeze({ useEffect, useRef });
  const useCueEffects = createCueEffects({ useEffect, useRef });
  const useAnimationFlow = createAnimationFlow({ useRef });
  const useCardAnimation = createCardAnimation({ useEffect, useRef });
  const useCardMotion = createCardMotion({ useEffect, useRef });
  const useCardDrag = createCardDrag({ useRef });
  const useCardRest = createCardRest({ useEffect, useRef });
  const useCardIdleEvents = createCardIdleEvents({ useEffect, useRef });
  const useCardEntry = createCardEntry({ useEffect, useRef });

  return function useCardRuntime(props: PetCardProps): CardViewProps {
    const { arena, balance, balanceManual, cfg, lock, lockTick, menuItemsRef, workStatus } = props;

    // 卡片状态容器：动画、朝向、拖拽态、提示与自定义位置；写入口在 card-state。
    const card = useCardState({
      anim: cfg.animations.idle[0] ?? '',
      corner: cfg.position.corner,
      margin: { x: cfg.position.marginX, y: cfg.position.marginY },
      size: cfg.size,
    });
    const { actions, state } = card;
    const { corner, customPos, dragging, facing, margin, size, tipOn } = state;

    // 驱动实例与跨关注点入口：创建顺序见模块头，填充只在本函数内。
    const liveRef = useRef<CardLive>({} as CardLive);
    const menuActionsRef = useRef<MenuActions | null>(null);
    const entryRef = useRef<CardEntry | null>(null);
    const pendingSquashRef = useRef(false);

    // 成品配置与工作状态的最新值：回调晚于状态更新，只能读 ref。
    const cfgRef = useRef(cfg);
    cfgRef.current = cfg;
    const workStatusRef = useRef(workStatus);
    workStatusRef.current = workStatus;

    // 心情 / 亲密度：localStorage 持久化、点击上涨、定时衰减；档位影响点击台词与作息动画。
    const mood = useCardMood({ cfgRef });
    const exciteTimerRef = useRef<number | null>(null);

    // DOM 节点：视图挂载后才有值，驱动全部经取值函数读。
    const rootRef = useRef<HTMLDivElement | null>(null);
    const stageRef = useRef<HTMLDivElement | null>(null);
    const videoARef = useRef<HTMLVideoElement | null>(null);
    const videoBRef = useRef<HTMLVideoElement | null>(null);
    const tipRef = useRef<HTMLDivElement | null>(null);

    // 回执在 playback-report.ts：地址、请求体与失败日志都在那里，这里只要一个函数。
    const reportPlayback = makePlaybackReporter({ petId: cfg.id });

    // 尺寸与派生几何；度量系数在 motion/geometry.ts，这里只解构使用。
    const { halfW, halfH, bottomPad, sideAllow } = derivePetMetrics(size);
    // 字号按本宠物尺寸算好注入 root，气泡与悬浮提示读它。
    const fontPx = resolveFontPx(cfg.font, size);
    const petAnims = cfg.animations;

    // 配置变化即时跟随，容器重新合并或设置页保存后触发。
    useEffect(() => {
      actions.setSize(cfg.size);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- setter 稳定，变化原因只有配置尺寸
    }, [cfg.size]);

    useEffect(() => {
      actions.setCorner(cfg.position.corner);
      actions.setMargin({ x: cfg.position.marginX, y: cfg.position.marginY });
      // 改位置是明确的「放这里」：清掉会话内的拖拽位置，让配置重新生效——
      // 这也是设置页把跑出视口的宠物叫回来的通道。只调大小不在此列，不该丢位置。
      actions.setCustomPos(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- setter 稳定，变化原因只有这三个位置字段
    }, [cfg.position.corner, cfg.position.marginX, cfg.position.marginY]);

    // 三种气泡的单槽：显隐、停留计时与优先级都在 bubble-slots，这里只喂视图输入。
    const bubbles = useBubbleSlots({
      assetRoot: cfg.assetRoot,
      balance,
      balanceEnabled: cfg.balanceEnabled,
      balanceManual,
      workStatusEnabled: cfg.workStatusEnabled,
      workTerminal: workStatus?.state === 'success' || workStatus?.state === 'error',
      workHasTask: hasTask(workStatus),
      workProgress: progressText(workStatus),
    });

    const ownAnim = useCardAnimation({
      card,
      cfgRef,
      live: liveRef,
      lock,
      pendingSquash: pendingSquashRef,
      petId: cfg.id,
      report: reportPlayback,
      setCuePlayback: actions.setCuePlayback,
      videoA: () => videoARef.current,
      videoB: () => videoBRef.current,
      workStatusRef,
    });

    const motion = useCardMotion({
      arena,
      card,
      cfgRef,
      live: liveRef,
      metrics: { bottomPad, halfH, halfW, sideAllow, size },
      moves: petAnims.moves,
      petId: cfg.id,
      root: () => rootRef.current,
      setAnim: actions.setAnim,
      setCustomPos: actions.setCustomPos,
      setOnce: actions.setOnce,
    });

    // 宠物作息：空闲打瞌睡、点击/说话/工作状态活动时醒来；心情档位影响打盹阈值与撒娇/叹气动画。
    const rest = useCardRest({
      cfgRef,
      actions,
      mood: () => ({ enabled: mood.enabled(), tier: mood.tier(), params: mood.params() }),
      hasAnim: (name) => animExists(cfgRef.current.animations, name),
    });
    const markActivity = (): void => rest.poke();

    /** 心情点满时的彩蛋：朝最近屏幕边缘冲刺撞墙，接触点炸开暖色粒子，撞回后随机掉回 61~99。
     *  返回 true = 冲刺抛掷真的起飞了（调用方据此不再收手，免得把彩蛋当场掐灭）；
     *  拖拽中无法起飞时降级为原地冲刺跑并返回 false。 */
    const triggerMoodExcite = (): boolean => {
      const settle = (): void => {
        if (exciteTimerRef.current !== null) {
          window.clearTimeout(exciteTimerRef.current);
          exciteTimerRef.current = null;
        }
        motion.clearBounceHandler();
        mood.finishExcite();
        bubbles.showWhisper(mood.label(), {}, 4000);
      };
      // 撞墙打粒子：每次反弹在接触点爆一圈暖色粒子；第一次撞到就足够震撼，之后继续。
      let bounced = false;
      const onBounce = (x: number, y: number, speed: number): void => {
        // 冲击越大粒子越猛（用速度给爆发做轻微增益：低俗时也至少正常爆一簇）。
        spawnScoreBurst(x, y);
        if (!bounced) {
          bounced = true;
          bubbles.showWhisper('心情满格！撞一下～', {}, 4000);
        }
        // 撞过墙后给一个较短的收尾窗口，让宠物弹回一两次就落定。
        if (exciteTimerRef.current !== null) window.clearTimeout(exciteTimerRef.current);
        exciteTimerRef.current = window.setTimeout(settle, 900);
        void speed;
      };
      // 先停掉随机链/走位，再起飞；起飞成功就交给物理，失败则退化为原地动画。
      const launched = motion.celebrate(onBounce);
      if (!launched) {
        if (animExists(cfgRef.current.animations, MOOD_EXCITE_ANIM)) {
          bubbles.showWhisper('心情满格！原地冲刺跑～', {}, 6000);
          actions.setOnce(true);
          actions.setAnim(MOOD_EXCITE_ANIM);
          actions.bumpSeq();
        } else {
          bubbles.showWhisper('心情满格啦～', {}, 4000);
        }
      }
      // 兜底：万一一直没撞（比如朝开阔侧没墙/被拖拽打断），到时也结算。
      if (exciteTimerRef.current !== null) window.clearTimeout(exciteTimerRef.current);
      exciteTimerRef.current = window.setTimeout(settle, MOOD_EXCITE_SAFETY_MS);
      // 无论冲刺起飞还是原地降级，彩蛋都已接管本次点击的运动/动画：返回 true，让点击处理放过它。
      return true;
    };

    // 卸载时清掉彩蛋计时器（避免宠物被删后回调写气泡）。
    useEffect(
      () => () => {
        if (exciteTimerRef.current !== null) {
          window.clearTimeout(exciteTimerRef.current);
          exciteTimerRef.current = null;
        }
      },
      [],
    );

    /** 亲密度阶段达成：播一句阶段专属标语气泡（带阶段名），并（若有开心动画）播一遍表示高兴。 */
    const triggerIntimacyPromote = (to: IntimacyTier): void => {
      const stage = intimacyStageOf(readIntimacyParams(cfgRef.current.intimacy), to);
      bubbles.showWhisper('【' + stage.label + '】' + stage.motto, {}, 6000);
      const happy = mood.params().happyAnim;
      if (happy && animExists(cfgRef.current.animations, happy)) {
        actions.setOnce(true);
        actions.setAnim(happy);
        actions.bumpSeq();
      }
      // 上报宿主：记录首次达到该阶段（供周年纪念日演出）。日期取本地 Y-M-D。
      const d = new Date();
      const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      void postAction(
        ROUTE_PATH +
          '/intimacy?pet=' +
          encodeURIComponent(cfg.id) +
          '&stage=' +
          encodeURIComponent(to) +
          '&date=' +
          encodeURIComponent(key),
      );
    };

    const drag = useCardDrag({
      bumpSeq: actions.bumpSeq,
      card,
      cfgRef,
      live: liveRef,
      mood,
      motion,
      pendingSquash: pendingSquashRef,
      root: () => rootRef.current,
      setAnim: actions.setAnim,
      setCustomPos: actions.setCustomPos,
      setDragging: actions.setDragging,
      setOnce: actions.setOnce,
      setTipOn: actions.setTipOn,
      stage: () => stageRef.current,
      onSayText: (text: string) => {
        bubbles.showWhisper(text, {});
        markActivity();
      },
      onActivity: () => {
        markActivity();
        const touched = mood.touch();
        if (touched.hitMax) return triggerMoodExcite();
        if (touched.promoted && touched.promotedTo) triggerIntimacyPromote(touched.promotedTo);
        return false;
      },
    });

    // 随机小事件：空闲时自己跑出来做件事（伸懒腰/张望/打哈欠）。只在真的闲着时才播，
    // 且会顺带刷新作息计时——小事件本身就是「活动」，避免和打瞌睡撞车。
    useCardIdleEvents({
      cfgRef,
      hasAnim: (name) => animExists(cfgRef.current.animations, name),
      canPlay: () =>
        !drag.isActive() &&
        !rest.isSleeping() &&
        !lockFreeze.frozen() &&
        (!workStatus || workStatus.state === null || workStatus.state === 'success' || workStatus.state === 'error'),
      playOnce: (name) => {
        actions.setOnce(true);
        actions.setAnim(name);
        actions.bumpSeq();
        markActivity();
      },
      say: (text) => bubbles.showWhisper(text, {}),
      currentAnim: () => card.animRef.current,
    });

    // 右键菜单、对话与悬浮提示：动作派发经 ref 转发，避免与 menu-actions 构造期成环。
    const entry = useCardEntry({
      card,
      cfgRef,
      drag,
      live: liveRef,
      menuItemsRef,
      motion,
      runMenuAction: (leaf, playbackId, keepFacing) => menuActionsRef.current?.run(leaf, playbackId, keepFacing),
      stage: () => stageRef.current,
      tipRef,
    });
    entryRef.current = entry;

    // 菜单动作派发：依赖运动、拖拽、提示与对话四处入口，所以放在它们之后。
    menuActionsRef.current ??= createMenuActions({
      animations: () => cfgRef.current.animations,
      applyMerged: (merged) => petBridge.reload(merged),
      faceLeft: () => actions.setFacing('left'),
      isFacingRight: () => card.facingRef.current === 'right',
      openChat: () => entryRef.current?.openChat(),
      petId: cfg.id,
      playOnce: (anim, playbackId) => {
        actions.setOnce(true);
        actions.setAnim(anim);
        actions.setCuePlayback(playbackId);
      },
      report: reportPlayback,
      resetPosition: () => actions.setCustomPos(null),
      stopMove: motion.stopMove,
      stopThrow: () => motion.flight.stop(),
      tryMove: motion.walk.tryMove,
      warn: (message) => console.warn(message),
    });
    const menuActions = menuActionsRef.current;

    // 占用锁：宿主靠内存持有，渲染端靠 /state 的 pets.<id>.lock 叶子感知。
    // 冻结只挡自播行为；显式指令（say / anim / position / throw）一概不挡，那正是持锁者要保护的内容。
    const lockFreeze = useLockFreeze({
      lock,
      lockTick,
      onFrozen: () => {
        // 光堵随机链不够：它只在动画播完时调用，不暂停会把当前这段播完才停。
        motion.stopMove();
        // 任务状态气泡：锁一生效就收掉，解冻不补亮。
        bubbles.hideWork();
      },
      onResumed: () => {
        // 解冻：非终态工作状态回档位循环，否则回 idle 一次，播完由动画链接回随机链。
        if (liveRef.current.flow?.resumeWorkStatusAnim() ?? false) return;
        if (petAnims.idle.length) {
          actions.setAnim(pick(petAnims.idle, card.animRef.current));
          actions.setOnce(true);
          actions.bumpSeq();
        }
      },
      setFrozen: ownAnim.setFrozen,
    });
    liveRef.current.releaseLock = () => {
      lockFreeze.release();
      void postAction(ROUTE_PATH + '/lock/release?pet=' + encodeURIComponent(cfg.id), { force: true });
    };

    // 共享运行时：状态容器、驱动与跨关注点动作拼成一份，指令处理按需取值。
    const hub: CardHub = {
      anims: () => cfgRef.current.animations,
      applyThrow: motion.applyThrow,
      bubbles,
      card,
      cfg: () => cfgRef.current,
      isDragging: () => drag.isActive(),
      ownAnim,
      playByName: (anim, playbackId, keepFacing) => menuActions.run({ anim, label: anim }, playbackId, keepFacing),
      posFollow: motion.posFollow,
      speak: (text, image, url, duration, anim) => liveRef.current.flow?.speak(text, image, url, duration, anim),
      pokeRest: markActivity,
      stopMotion: motion.stopMove,
      tryWalk: motion.walk.tryMove,
    };
    // 七条指令的分派在 cue-effects：这里只把当拍 props 交过去。
    useCueEffects(hub, props);
    // 动画流比指令处理晚一步创建：它要读工作状态，也要经 hub 说话与恢复档位。
    const flow = useAnimationFlow(hub, workStatus);
    liveRef.current.flow = flow;

    const stageStyle = petStageStyle(dragging, bottomPad);
    const rootStyle = petRootStyle(
      customPos,
      { width: window.innerWidth, height: window.innerHeight },
      { h: halfH, w: halfW },
    );

    return {
      // 气泡单槽：三种气泡共用同一套定位，按优先级只挂一个。
      bubble: bubbles.node(),
      corner,
      facing,
      fontBubblePx: fontPx.bubble,
      fontTipPx: fontPx.tip,
      marginX: margin.x,
      marginY: margin.y,
      name: cfg.name,
      // 悬浮提示：心情启用时附带当前数值与档位（与桌面端 showMoodOnHover 同一信息）；
      // 亲密度启用时再附「阶段名」。
      tipText: mood.enabled()
        ? cfg.name + ' · ' + mood.label() + (mood.intimacyEnabled() ? ' · ' + mood.intimacyLabel() : '')
        : cfg.name,
      onClick: drag.onClick,
      onContextMenu: entry.handleContextMenu,
      onPointerDown: drag.onPointerDown,
      onPointerEnter: entry.onPointerEnter,
      onPointerLeave: entry.onPointerLeave,
      onPointerMove: drag.onPointerMove,
      onPointerUp: drag.onPointerUp,
      rootRef,
      rootStyle,
      size,
      stageRef,
      stageStyle,
      tipOn,
      tipRef,
      videoARef,
      videoBRef,
    };
  };
}
