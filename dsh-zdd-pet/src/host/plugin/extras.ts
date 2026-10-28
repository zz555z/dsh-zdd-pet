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
import type { HostSetup } from './setup.ts';

/** 投递所需的宿主能力。 */
export type ExtrasInput = Pick<HostSetup, 'configPaths'> & Pick<HostSetup, 'memeDirsFor'> & Pick<HostSetup, 'state'>;

/** 一条待投递的气泡内容：文案 + 可选表情包名（配图）。 */
export interface CueContent {
  text: string;
  image?: string;
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
    state.writePet(petId, 'say', image ? { text, image } : { text });
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
          const cue = pickEasterEgg(eggs, state, poolNames, rand);
          if (!cue) continue;
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

  return { deliverCue, pickPetMeme, petConf, deliverEasterEgg, memeValid };
}
/** 附加玩法投递器。 */
export type Extras = ReturnType<typeof createExtras>;
