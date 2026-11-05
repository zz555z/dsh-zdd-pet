/**
 * 主动关心：宠物在合适时机自己冒一句关心话（久未搭理 / 深夜还在忙 / 刚做完一段专注）。
 *
 * 纯判据在 shared/proactive.ts（decideCare）；本模块负责「信号收集 + 定时检查 + 生成投递 + 冷却去重」。
 * 生成走 generateWhisper（自定义 prompt），结果写 pets.<id>.say——与碎碎念同一条展示链路。
 * 冷却/上次交互用内存态（重启重置，键为 petId）；没交互就是没交互，宁可重启后多关心一次也不误报。
 * 零额外快照叶子：判据所需信号都在本进程内存里。
 * @module dsh-zdd-pet/src/host/plugin/proactive
 */

import { findPetInstance, flattenPetList, readAllConfig } from '../config.ts';
import { generateWhisper } from '../whisper.ts';
import { composeSystemPrompt, petPersona } from '../persona.ts';
import { pickMeme, readMemePool } from '../memes.ts';
import { decideCare, readProactiveParams, type CareReason } from '../../shared/proactive.ts';
import type { ModelRef } from '../model-selection.ts';
import type { HostSetup } from './setup.ts';
import type { HostContext } from './context.ts';

/** 主动关心的输入。 */
export type ProactiveInput = {
  ctx: HostContext;
} & Pick<HostSetup, 'configPaths' | 'state' | 'log' | 'memeDirsFor'> & {
    /** 某条目配置的模型选择（whisperModel）。 */
    configuredModel: (conf: Record<string, unknown>, key: 'whisperModel' | 'chatModel') => ModelRef | undefined;
    /** 现在是否「最近在工作活动」（读工作状态快照的最近变化时刻；用于深夜提醒）。 */
    recentlyActive: () => boolean;
  };

/** 检查间隔（ms）：主动关心是低频事件，5 分钟一拍足够，开销可忽略。 */
const TICK_MS = 5 * 60 * 1000;

/** 触发原因对应的生成指令。 */
function promptFor(reason: CareReason): string {
  switch (reason) {
    case 'idle':
      return (
        '你注意到主人很久没来跟你说话了。主动说一句话，表达想念、问问他最近在忙什么，' +
        '温柔俏皮、一句话、20 字以内，不要解释、不要提你是 AI。'
      );
    case 'late-night':
      return (
        '现在是深夜，主人还在忙。主动说一句话，关心他早点休息、别太熬夜，' +
        '温柔俏皮、一句话、20 字以内，不要啰嗦、不要提你是 AI。'
      );
    case 'after-focus':
      return (
        '主人刚认真专注了一段时间，刚告一段落。主动说一句话，夸夸他、提醒他起身活动/喝口水，' +
        '温柔俏皮、一句话、20 字以内，不要提你是 AI。'
      );
    default:
      return '主动说一句关心主人的话，一句话、20 字以内。';
  }
}

/**
 * 创建主动关心循环。
 *
 * @returns 记录交互/专注信号的几个入口 + 启动循环的函数。
 */
export function createProactive(deps: ProactiveInput) {
  const { ctx, configPaths, state, log, memeDirsFor, configuredModel, recentlyActive } = deps;
  /** 每只宠物上次「真实交互」时刻（对话 / 点击等）。0 = 未知。 */
  const lastInteractionAt = new Map<string, number>();
  /** 每只宠物上次主动关心时刻。 */
  const lastCareAt = new Map<string, number>();
  /** 刚做完专注的宠物（一次性信号，检查后消费）。 */
  const justFinishedFocus = new Set<string>();

  const touchInteraction = (petId: string): void => {
    if (petId) lastInteractionAt.set(petId, Date.now());
  };
  const markFocusComplete = (petId: string): void => {
    if (petId) {
      justFinishedFocus.add(petId);
      // 专注本身就是交互，刷新一下，避免紧接着又因「久未搭理」重复关心。
      lastInteractionAt.set(petId, Date.now());
    }
  };

  /** 给一只宠物投一句主动关心；失败静默。 */
  const care = async (petId: string, reason: CareReason): Promise<void> => {
    const cfg = readAllConfig(configPaths);
    const found = findPetInstance(cfg, petId);
    if (!found) return;
    const system = composeSystemPrompt({
      prompt: petPersona(found.conf, found.pet),
      name: String(found.pet.name ?? ''),
      id: petId,
      now: new Date(),
    });
    const meme =
      found.conf.bubbleImageEnabled !== false
        ? pickMeme(readMemePool(found.conf.memes, memeDirsFor(found.entry)))
        : undefined;
    const r = await generateWhisper(ctx, system, meme, configuredModel(found.conf, 'whisperModel'), promptFor(reason));
    if (!r.ok) {
      log.warn(`[dsh-zdd-pet] 主动关心生成失败 pet=${petId} reason=${r.reason}`);
      return;
    }
    state.publishSay(petId, r.image ? { text: r.text, image: r.image } : { text: r.text }, { source: 'proactive' });
    lastCareAt.set(petId, Date.now());
    log.info(`[dsh-zdd-pet] 主动关心（${reason}）pet=${petId}：「${r.text}」`);
  };

  /** 起循环：每 TICK_MS 检查一次，逐宠物按 decideCare 判据决定要不要关心。 */
  const start = (): void => {
    ctx.effect(() => {
      let disposed = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const tick = (): void => {
        if (disposed) return;
        try {
          const cfg = readAllConfig(configPaths);
          const now = Date.now();
          const hour = new Date(now).getHours();
          for (const pet of flattenPetList(cfg)) {
            const petId = String(pet.id ?? '');
            if (!petId) continue;
            const found = findPetInstance(cfg, petId);
            if (!found) continue;
            // 一次性信号「刚做完专注」无论本次是否启用/触发都先消费掉：否则关掉 proactive 的宠物
            // 会在 Set 里留下一个永不清理的 key。
            const finishedFocus = justFinishedFocus.has(petId);
            justFinishedFocus.delete(petId);
            const params = readProactiveParams(found.conf.proactive);
            if (!params.enabled) continue;
            const reason = decideCare({
              params,
              now,
              lastInteractionAt: lastInteractionAt.get(petId) ?? 0,
              lastCareAt: lastCareAt.get(petId) ?? 0,
              hour,
              recentlyActive: recentlyActive(),
              justFinishedFocus: finishedFocus,
            });
            if (reason) void care(petId, reason).catch(() => {});
          }
        } catch (e) {
          log.warn('[dsh-zdd-pet] 主动关心检查失败：' + (e instanceof Error ? e.message : String(e)));
        }
        timer = setTimeout(tick, TICK_MS);
      };
      timer = setTimeout(tick, TICK_MS);
      return () => {
        disposed = true;
        if (timer !== null) clearTimeout(timer);
      };
    }, 'dsh-zdd-pet: proactive care');
  };

  return { start, touchInteraction, markFocusComplete };
}

export type Proactive = ReturnType<typeof createProactive>;
