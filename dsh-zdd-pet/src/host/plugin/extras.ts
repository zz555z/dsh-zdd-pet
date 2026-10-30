/**
 * 附加玩法的共用投递口：把一句预设文案（+可选表情包配图）写进某只宠物的 say 叶子。
 *
 * 番茄钟 / 任务彩蛋 / 余额告急演出三个玩法都需要「不经模型、直接把一句设定好的话放到气泡上」，
 * 投递链路与碎碎念相同（同一条 pets.<id>.say 叶子），所以收敛到这里，避免三处各写一份。
 * 不负责配置解析与"该不该触发"的判定（归各玩法模块），只负责"把选好的内容送出去"。
 * @module dsh-zdd-pet/src/host/plugin/extras
 */
import { findPetInstance, readAllConfig } from '../config.ts';
import { parseEasterEggs, pickEasterEgg } from '../easter-egg.ts';
import { matchMeme, pickMeme, readMemePool } from '../memes.ts';
import { CONFIRM_HOLD_MS, CONFIRM_PREFERRED_IMAGES, type ConfirmKind } from '../confirm.ts';
import type { HostSetup } from './setup.ts';

/** 投递所需的宿主能力。 */
export type ExtrasInput = Pick<HostSetup, 'configPaths'> & Pick<HostSetup, 'memeDirsFor'> & Pick<HostSetup, 'state'>;

/** 一条待投递的气泡内容：文案 + 可选表情包名（配图）+ 可选常驻/时长。 */
export interface CueContent {
  text: string;
  image?: string;
  /** 常驻气泡（等待用户确认）：不自动收起，直到宿主 clear。 */
  hold?: boolean;
  /** 显式停留时长（毫秒）；hold 时通常不再需要。 */
  duration?: number;
}

/**
 * 创建附加玩法投递器。
 *
 * @param deps - 宿主能力（配置路径 / 表情包目录链 / 轮询快照）。
 * @returns 投递函数与随机取表情包的工具。
 */
export function createExtras(deps: ExtrasInput) {
  const { configPaths, memeDirsFor, state } = deps;

  /** 把一条内容写进某宠物的 say 叶子；宠物不存在 / 文案为空 → 不投（返回 false）。 */
  const deliverCue = (petId: string, cue: CueContent): boolean => {
    const text = String(cue.text ?? '').trim();
    if (!text) return false;
    const image = cue.image ? String(cue.image).trim() : '';
    state.writePet(petId, 'say', {
      text,
      ...(image ? { image } : {}),
      ...(cue.duration !== undefined ? { duration: cue.duration } : {}),
      ...(cue.hold ? { hold: true } : {}),
    });
    return true;
  };

  /**
   * 在指定宠物的表情包池里抽一张；池为空 → undefined。
   *
   * 用配置里写的 memes 池（与碎碎念/对话同源），保证投出去的名字一定能取到图，不会破图。
   * 池未知（宠物不存在）→ undefined（调用方退回纯文字）。
   */
  const pickPetMeme = (petId: string): string | undefined => {
    const found = findPetInstance(readAllConfig(configPaths), petId);
    if (!found) return undefined;
    const pool = readMemePool(found.conf.memes, memeDirsFor(found.entry));
    return pickMeme(pool)?.name;
  };

  /** 某宠物所属条目的配置（用于读取条目级字段，如 pomodoro/taskEasterEggs/balanceGag）；不存在 → undefined。 */
  const petConf = (petId: string): Record<string, unknown> | undefined =>
    findPetInstance(readAllConfig(configPaths), petId)?.conf;

  /**
   * 任务彩蛋：对**全部**宠物各投一条（taskEasterEggs 是条目级配置，各宠物按所属条目取自己的配置与表情包池）。
   * 某宠物配置为空 / 图名写错全被过滤 / 文字为空 → 该宠物不投。返回投出的宠物数。
   *
   * @param state - 终态：success / error。
   * @param rand - 随机源，便于单测注入。
   */
  const deliverEasterEgg = (state: 'success' | 'error', rand: () => number = Math.random): number => {
    // 彩蛋是锦上添花：读配置 / 选图任何一步失败都静默跳过，绝不冒泡打断 turn/end 主流程。
    let cfg: Record<string, Record<string, unknown>>;
    try {
      cfg = readAllConfig(configPaths);
    } catch {
      return 0;
    }
    let delivered = 0;
    for (const [entry, conf] of Object.entries(cfg)) {
      try {
        const eggs = parseEasterEggs(conf?.taskEasterEggs);
        if (!eggs) continue;
        const pets = Array.isArray(conf?.pets) ? (conf.pets as Record<string, unknown>[]) : [];
        // 该条目下的表情包池：用来过滤配置里写错的图名（写错的跳过，不变破图）。
        const pool = readMemePool(conf?.memes, memeDirsFor(entry));
        const poolNames = new Set(pool.map((m) => m.name));
        for (const pet of pets) {
          const petId = String(pet.id ?? '');
          if (!petId) continue;
          // 气泡表情包总开关关闭：彩蛋只投文字（不配图）
          const cueRaw = pickEasterEgg(eggs, state, poolNames, rand);
          if (!cueRaw) continue;
          const cue = conf.bubbleImageEnabled === false ? { text: cueRaw.text } : cueRaw;
          if (deliverCue(petId, cue)) delivered += 1;
        }
      } catch {
        // 单条目出错不影响其它条目，也不影响主流程。
      }
    }
    return delivered;
  };

  /** 配图名是否命中某宠物的表情包池（余额告急演出用配置指定的图名时校验）。 */
  const memeValid = (petId: string, name: string): boolean => {
    const found = findPetInstance(readAllConfig(configPaths), petId);
    if (!found) return false;
    return !!matchMeme(readMemePool(found.conf.memes, memeDirsFor(found.entry)), name);
  };

  /**
   * 等待用户确认：给**所有启用工作状态联动**的宠物各投一条常驻气泡（配对应表情包）。
   *
   * 常驻（hold）由客户端保证：不自动收起、优先级最高，直到宿主调用 {@link clearConfirm}。
   * 表情包优先从该宠物自己的池里挑与场景匹配的（approval / question 各有偏好名单），
   * 池里没有就随机一张；气泡配图总开关关闭时只投文字。
   *
   * @param kind - 场景：审批 / 提问。
   * @param text - 气泡文案（由调用方用 confirmText 生成）。
   * @param rand - 随机源，便于单测注入。
   * @returns 投出的宠物数。
   */
  const deliverConfirm = (kind: ConfirmKind, text: string, rand: () => number = Math.random): number => {
    let cfg: Record<string, Record<string, unknown>>;
    try {
      cfg = readAllConfig(configPaths);
    } catch {
      return 0;
    }
    let delivered = 0;
    for (const [entry, conf] of Object.entries(cfg)) {
      const pets = Array.isArray(conf?.pets) ? (conf.pets as Record<string, unknown>[]) : [];
      const canImage = conf?.bubbleImageEnabled !== false;
      const pool = canImage ? readMemePool(conf?.memes, memeDirsFor(entry)) : [];
      const preferred = CONFIRM_PREFERRED_IMAGES[kind];
      const preferredPool = pool.filter((m) => preferred.includes(m.name));
      const image = canImage
        ? (preferredPool.length > 0 ? preferredPool[Math.floor(rand() * preferredPool.length)] : pickMeme(pool, rand))
            ?.name
        : undefined;
      for (const pet of pets) {
        const petId = String(pet.id ?? '');
        // 只投给启用了工作状态联动的宠物：没启用联动的宠物平时就不显示状态气泡，确认气泡也不该突然出现。
        if (!petId || pet.workStatusEnabled !== true) continue;
        if (deliverCue(petId, { text, ...(image ? { image } : {}), hold: true, duration: CONFIRM_HOLD_MS })) {
          delivered += 1;
        }
      }
    }
    return delivered;
  };

  /**
   * 确认已完成：收起所有启用工作状态联动宠物身上的确认气泡（幂等）。
   * 只发 clear，不判断当前是不是确认气泡——客户端在没有气泡时 clear 是幂等的。
   *
   * @returns 发送 clear 的宠物数。
   */
  const clearConfirm = (): number => {
    let cfg: Record<string, Record<string, unknown>>;
    try {
      cfg = readAllConfig(configPaths);
    } catch {
      return 0;
    }
    let cleared = 0;
    for (const conf of Object.values(cfg)) {
      const pets = Array.isArray(conf?.pets) ? (conf.pets as Record<string, unknown>[]) : [];
      for (const pet of pets) {
        const petId = String(pet.id ?? '');
        if (!petId || pet.workStatusEnabled !== true) continue;
        state.writePet(petId, 'say', { clear: true });
        cleared += 1;
      }
    }
    return cleared;
  };

  return { deliverCue, pickPetMeme, petConf, deliverEasterEgg, memeValid, deliverConfirm, clearConfirm };
}
/** 附加玩法投递器。 */
export type Extras = ReturnType<typeof createExtras>;
