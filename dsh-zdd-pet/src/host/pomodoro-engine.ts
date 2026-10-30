/**
 * 番茄钟计时引擎：专注 / 短休息 / 长休息的状态机、暂停继续、跳过重置，以及到点投递气泡。
 *
 * 纯宿主内存态，不调模型（零 token）。配置读 main 条目的 pomodoro 段（与旧版同一份），
 * 文案与配图走 extras.deliverCue / pickPetMeme（与碎碎念同一展示链路）。
 * 右键菜单只发动作，状态由这里维护；「查看剩余」会把当前倒计时写进气泡。
 * @module dsh-zdd-pet/src/host/pomodoro-engine
 */
import { readAllConfig } from './config.ts';
import { parsePomodoro, type PomodoroConfig } from './pomodoro.ts';
import { formatPomodoroClock } from '../shared/pomodoro.ts';
import type { Extras } from './plugin/extras.ts';
import type { HostSetup } from './plugin/setup.ts';

/** 菜单/路由可触发的动作。 */
export type PomodoroAction = 'start' | 'pause' | 'resume' | 'stop' | 'reset' | 'skip' | 'status';

/** 引擎对外能力。 */
export interface PomodoroEngine {
  /** 执行一个动作；失败给出原因（路由回 ok:false）。 */
  control(action: PomodoroAction, petId: string): { ok: boolean; reason?: string; message?: string };
  /** 停掉定时器（插件卸载）。 */
  dispose(): void;
}

/** 引擎依赖：配置 / 状态 / 日志 / 表情包投递。 */
export type PomodoroEngineInput = Pick<HostSetup, 'configPaths' | 'state' | 'log' | 'memeDirsFor'> &
  Pick<Extras, 'deliverCue' | 'pickPetMeme'>;

type Phase = 'idle' | 'focus' | 'break' | 'long-break';

/**
 * 创建番茄钟引擎。
 *
 * @param deps - 宿主能力。
 * @returns 动作入口与卸载清理。
 */
export function createPomodoroEngine(deps: PomodoroEngineInput): PomodoroEngine {
  const { configPaths, log, pickPetMeme, deliverCue, state } = deps;
  let phase: Phase = 'idle';
  let endsAt = 0;
  /** 暂停时的剩余秒数。 */
  let remainingSec = 0;
  let paused = false;
  let completedFocus = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  /** 每个宠物的番茄钟气泡配图缓存：倒计时刷新时不换图。 */
  const bubbleImages = new Map<string, string | undefined>();
  let disposed = false;

  const clearTimer = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const readCfg = (): { cfg: Record<string, Record<string, unknown>>; pomo: PomodoroConfig | undefined } => {
    try {
      const cfg = readAllConfig(configPaths);
      return { cfg, pomo: parsePomodoro(cfg.main?.pomodoro) };
    } catch {
      return { cfg: {}, pomo: undefined };
    }
  };

  /** 把一句话投给所有启用了番茄钟的宠物（各自配图；hold = 常驻倒计时气泡）。 */
  const broadcast = (text: string, hold = false): void => {
    const { cfg, pomo } = readCfg();
    if (!pomo) return;
    for (const conf of Object.values(cfg)) {
      if (!parsePomodoro(conf?.pomodoro)) continue;
      const pets = Array.isArray(conf?.pets) ? (conf.pets as Record<string, unknown>[]) : [];
      for (const pet of pets) {
        const petId = String(pet.id ?? '');
        if (!petId) continue;
        if (!bubbleImages.has(petId)) {
          bubbleImages.set(petId, conf.bubbleImageEnabled !== false ? pickPetMeme(petId) : undefined);
        }
        const image = bubbleImages.get(petId);
        deliverCue(petId, { text, ...(image ? { image } : {}), ...(hold ? { hold: true } : {}) });
      }
    }
  };

  /** 收起所有番茄钟宠物身上的常驻倒计时气泡。 */
  const clearBubbles = (): void => {
    const { cfg } = readCfg();
    for (const conf of Object.values(cfg)) {
      if (!parsePomodoro(conf?.pomodoro)) continue;
      const pets = Array.isArray(conf?.pets) ? (conf.pets as Record<string, unknown>[]) : [];
      for (const pet of pets) {
        const petId = String(pet.id ?? '');
        if (petId) state.writePet(petId, 'say', { clear: true });
      }
    }
  };

  /** 只投给发起动作的宠物（关闭 / 出错提示用）。 */
  const sayTo = (petId: string, text: string): void => {
    if (!petId) return;
    const image = pickPetMeme(petId);
    deliverCue(petId, image ? { text, image } : { text });
  };

  const remainNow = (): number =>
    paused ? remainingSec : phase === 'idle' ? 0 : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  /** 当前状态的一句话（菜单「查看剩余」/ 重复开始等场景）。 */
  const statusText = (): string => {
    if (phase === 'idle') return '番茄钟空闲中，右键可以开始专注～';
    const left = formatPomodoroClock(remainNow());
    const label = phase === 'focus' ? '专注中' : phase === 'break' ? '休息中' : '长休息中';
    return `${label}${paused ? '（已暂停）' : ''} · 剩余 ${left} · 已完成 ${completedFocus} 轮`;
  };

  /** 常驻倒计时气泡的文案。 */
  const countdownText = (): string => {
    const label = phase === 'focus' ? '专注中' : phase === 'long-break' ? '长休息中' : '休息中';
    return label + (paused ? '（已暂停）' : '') + ' · 剩余 ' + formatPomodoroClock(remainNow());
  };

  const stopCountdown = (): void => {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  };

  /** 启动常驻倒计时气泡：立即显示一次，之后每 5 秒刷新剩余时间。 */
  const startCountdown = (): void => {
    stopCountdown();
    if (disposed) return;
    broadcast(countdownText(), true);
    countdownTimer = setInterval(() => {
      if (disposed || phase === 'idle' || paused) return;
      broadcast(countdownText(), true);
    }, 5000);
  };

  const arm = (): void => {
    if (disposed) return;
    clearTimer();
    timer = setTimeout(() => onPhaseEnd(), Math.max(0, endsAt - Date.now()));
  };

  const startFocus = (pomo: PomodoroConfig): void => {
    phase = 'focus';
    paused = false;
    remainingSec = Math.round(pomo.intervalMin * 60);
    endsAt = Date.now() + remainingSec * 1000;
    arm();
    bubbleImages.clear();
    startCountdown();
    log.info(`[dsh-zdd-pet] 番茄钟开始：专注 ${pomo.intervalMin} 分钟`);
  };

  const startBreak = (pomo: PomodoroConfig, long: boolean): void => {
    phase = long ? 'long-break' : 'break';
    const minutes = long ? pomo.longBreakMin : pomo.breakMin;
    remainingSec = Math.round(minutes * 60);
    paused = !pomo.autoStartBreak;
    endsAt = paused ? 0 : Date.now() + remainingSec * 1000;
    if (!paused) {
      arm();
      startCountdown();
    } else {
      broadcast('休息 ' + minutes + ' 分钟，右键点「继续」开始休息～', true);
    }
    log.info(`[dsh-zdd-pet] 番茄钟进入${long ? '长' : '短'}休息 ${minutes} 分钟，auto=${!paused}`);
  };

  const onPhaseEnd = (): void => {
    timer = null;
    if (disposed) return;
    const { pomo } = readCfg();
    if (!pomo) {
      phase = 'idle';
      return;
    }
    if (phase === 'focus') {
      completedFocus += 1;
      const long = pomo.roundsBeforeLongBreak > 0 && completedFocus % pomo.roundsBeforeLongBreak === 0;
      startBreak(pomo, long);
      return;
    }
    // 休息结束：回空闲；配置自动开始下一轮就继续。
    phase = 'idle';
    remainingSec = 0;
    stopCountdown();
    clearBubbles();
    log.info('[dsh-zdd-pet] 番茄钟休息结束，倒计时气泡已收起');
    if (pomo.autoStartFocus) startFocus(pomo);
  };

  const control = (action: PomodoroAction, petId: string): { ok: boolean; reason?: string; message?: string } => {
    if (disposed) return { ok: false, reason: 'disposed', message: '插件已卸载' };
    const { pomo } = readCfg();
    if (!pomo) {
      sayTo(petId, '番茄钟还没启用，去设置页开启一下吧～');
      return { ok: false, reason: 'disabled', message: '番茄钟未启用' };
    }
    switch (action) {
      case 'start':
        if (phase !== 'idle') {
          sayTo(petId, '番茄钟已经在走了：' + statusText());
          return { ok: true };
        }
        completedFocus = 0;
        startFocus(pomo);
        return { ok: true };
      case 'pause':
        if (phase === 'idle' || paused) {
          sayTo(petId, phase === 'idle' ? '现在还没开始番茄钟哦～' : '已经暂停啦～');
          return { ok: phase !== 'idle' };
        }
        remainingSec = remainNow();
        paused = true;
        clearTimer();
        stopCountdown();
        broadcast('已暂停 · 剩余 ' + formatPomodoroClock(remainingSec) + '（右键可继续）', true);
        return { ok: true };
      case 'resume':
        if (phase === 'idle' || !paused) {
          sayTo(petId, phase === 'idle' ? '还没有开始的番茄钟哦～' : '番茄钟正在走，不用继续～');
          return { ok: phase !== 'idle' };
        }
        paused = false;
        endsAt = Date.now() + remainingSec * 1000;
        arm();
        startCountdown();
        return { ok: true };
      case 'stop':
        clearTimer();
        stopCountdown();
        phase = 'idle';
        remainingSec = 0;
        paused = false;
        clearBubbles();
        log.info('[dsh-zdd-pet] 番茄钟已结束');
        return { ok: true };
      case 'reset':
        clearTimer();
        stopCountdown();
        phase = 'idle';
        remainingSec = 0;
        paused = false;
        completedFocus = 0;
        clearBubbles();
        log.info('[dsh-zdd-pet] 番茄钟已重置');
        return { ok: true };
      case 'skip':
        if (phase === 'idle') {
          sayTo(petId, '现在没有可跳过的阶段哦～');
          return { ok: false, reason: 'idle' };
        }
        clearTimer();
        stopCountdown();
        if (phase === 'focus') {
          startBreak(pomo, false);
        } else {
          phase = 'idle';
          remainingSec = 0;
          paused = false;
          clearBubbles();
          log.info('[dsh-zdd-pet] 休息已跳过');
        }
        return { ok: true };
      case 'status':
        if (phase === 'idle') sayTo(petId, statusText());
        else broadcast(statusText(), true);
        return { ok: true };
      default:
        return { ok: false, reason: 'bad-action', message: '未知的番茄钟动作：' + String(action) };
    }
  };

  return {
    control,
    dispose() {
      disposed = true;
      clearTimer();
      stopCountdown();
    },
  };
}
