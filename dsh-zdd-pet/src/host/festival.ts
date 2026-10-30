/**
 * 节日自动演出：当天命中节日表时，让桌宠说一句祝福并播对应节日动画。
 *
 * 复用 time-context 的节日表（与碎碎念人设里的时间背景同一份数据）与现成素材，
 * 零 token：不调用模型，只写 say / anim 两个状态叶子（say 的 anim=false，避免联动碎碎念动画）。
 * 同一天只演一次（跨重启按本地日期去重，状态存 userRoot/festival-state.json）。
 * @module dsh-zdd-pet/src/host/festival
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenPetList, findPetInstance, readAllConfig } from './config.ts';
import { entriesAt } from './time-context/lunar.ts';
import type { RankedEntry } from './time-context/entries.ts';
import { readFestivalParams } from '../shared/festival.ts';
import type { FestivalParams } from '../shared/festival.ts';
import { pickMeme, readMemePool } from './memes.ts';
import type { HostSetup } from './plugin/setup.ts';

/** 节日名 → 内置动画名（素材都在包内 assets/webm；不存在时只弹文字，不报错）。 */
export const FESTIVAL_ANIMATIONS: Readonly<Record<string, string>> = {
  春节: '收红包',
  除夕: '放烟花',
  元宵节: '吃汤圆',
  元旦: '写福字',
  中秋节: '中秋赏月吃月饼',
  国庆节: '放烟花',
  端午节: '吃粽子',
  清明节: '被落叶淹没',
  劳动节: '超大伸懒腰',
  儿童节: '吹气球',
  七夕: '穿针乞巧',
  中元节: '萌化小幽灵',
  龙抬头: '吃年糕',
  重阳节: '吃重阳糕',
  腊八节: '吃腊八粥',
  小年: '吃饺子',
  情人节: '凭空生花',
  跨年夜: '放烟花',
  愚人节: '变鸽子',
  青年节: '原地冲刺跑',
  妇女节: '凭空生花',
  教师节: '女仆屈膝礼仪',
  建党节: '放烟花',
  建军节: '舞狮头',
  万圣夜: '讨糖南瓜灯',
  平安夜: '装点圣诞树',
  圣诞节: '装点圣诞树',
  寒假: '堆雪人',
  暑假: '吃西瓜',
};

/** 节日名 → 内置祝福语（未列出的节日走通用模板）。 */
export const FESTIVAL_TEXTS: Readonly<Record<string, string>> = {
  春节: '新春快乐，红包拿来～',
  除夕: '除夕夜守岁啦，新年快乐！',
  元宵节: '元宵节快乐，吃汤圆咯～',
  元旦: '新年第一天，万事顺遂！',
  中秋节: '中秋快乐，月亮好圆呀～',
  国庆节: '国庆快乐，好好休息～',
  端午节: '端午安康，吃粽子啦～',
  清明节: '清明时节，记得踏青哦～',
  劳动节: '劳动节快乐，今天也要好好休息～',
  儿童节: '儿童节快乐，永远是小朋友～',
  七夕: '七夕快乐，愿你被温柔以待～',
  中元节: '中元节，早点回家哦～',
  龙抬头: '龙抬头，鸿运当头！',
  重阳节: '重阳节，登高赏菊啦～',
  腊八节: '腊八节，喝碗腊八粥～',
  小年: '小年到，年味渐浓啦～',
  情人节: '情人节快乐，甜甜蜜蜜～',
  跨年夜: '跨年夜快乐，新年见！',
  愚人节: '愚人节快乐，别被骗啦～',
  青年节: '青年节快乐，元气满满！',
  妇女节: '节日快乐，今天你最美～',
  教师节: '教师节快乐，桃李满天下～',
  建党节: '节日快乐，铭记初心～',
  建军节: '建军节快乐，致敬最可爱的人～',
  万圣夜: '万圣夜快乐，不给糖就捣蛋！',
  平安夜: '平安夜快乐，记得吃苹果～',
  圣诞节: '圣诞快乐，礼物收到了吗～',
  寒假: '放寒假啦，开心玩吧～',
  暑假: '放暑假啦，吃西瓜咯～',
};

/** 从 date 出发的本地日期键（YYYY-M-D；用于跨重启去重）。 */
export function dateKeyOf(date: Date): string {
  return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
}

/**
 * 当天命中的节日（取优先级最高的一个）；无节日 → undefined。
 * 只认「当天正好是节日」（公历/农历/除夕），不做节前预热——预热已在碎碎念文案里体现。
 */
export function festivalOf(date: Date): RankedEntry | undefined {
  if (Number.isNaN(date.getTime())) return undefined;
  const hits = entriesAt(date);
  if (hits.length === 0) return undefined;
  // entriesAt 的返回顺序不保证优先级（公历→农历→除夕），这里按 priority 取最小。
  return hits.reduce((best, cur) => (cur.priority < best.priority ? cur : best), hits[0]!);
}

/** 动画名是否存在于任意动画池（防播不存在的名字导致 404 卡住）。 */
export function animExists(anims: unknown, target: string): boolean {
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

/** 一次节日演出的内容。 */
export interface FestivalCue {
  /** 节日名 */
  name: string;
  /** 气泡文案 */
  text: string;
  /** 要播的动画名（可能不存在于该宠物池，调用方自行判断） */
  anim?: string;
}

/**
 * 计算一次节日演出：未启用 / 当天无节日 → undefined。
 * 文案与动画先看配置覆盖，再看内置表，最后通用模板 / 无动画。
 */
export function resolveFestival(date: Date, params: FestivalParams): FestivalCue | undefined {
  if (!params.enabled) return undefined;
  const hit = festivalOf(date);
  if (!hit) return undefined;
  const name = hit.entry.name;
  const text =
    params.texts[name] ?? FESTIVAL_TEXTS[name] ?? '今天是' + (hit.entry.spoken ?? name) + '，祝主人一切顺遂～';
  const anim = params.animations[name] ?? FESTIVAL_ANIMATIONS[name];
  return { name, text, ...(anim ? { anim } : {}) };
}

/** 去重状态文件：记录最近一次演出的日期与节日名。 */
const STATE_FILE = 'festival-state.json';

function readLast(userRoot: string): { date: string; name: string } | undefined {
  const file = join(userRoot, STATE_FILE);
  if (!existsSync(file)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as { date?: unknown; name?: unknown };
    return typeof raw.date === 'string' && typeof raw.name === 'string'
      ? { date: raw.date, name: raw.name }
      : undefined;
  } catch {
    return undefined;
  }
}

function writeLast(userRoot: string, value: { date: string; name: string }): void {
  try {
    writeFileSync(join(userRoot, STATE_FILE), JSON.stringify(value, null, 2), 'utf8');
  } catch {
    /* 写不进去只影响去重，不影响本次演出 */
  }
}

/** 节日自动演出所需依赖。 */
export type FestivalDeps = Pick<HostSetup, 'configPaths' | 'state' | 'log' | 'memeDirsFor' | 'userRoot'>;

/**
 * 启动时检查并在命中节日时给每只宠物投一句祝福 + 播节日动画。
 *
 * 投递口径与启动吉祥话一致：逐宠物、按所属条目的 festival 配置；同一天只演一次（跨重启去重）。
 *
 * @param deps - 宿主装配期依赖。
 * @param now - 当前时刻（测试可注入）。
 * @returns 投递的宠物数；未启用 / 当天无节日 / 今天已演过 → 0。
 */
export function maybeFestival(deps: FestivalDeps, now: Date = new Date()): number {
  const { configPaths, state, log, memeDirsFor, userRoot } = deps;
  let cfg: Record<string, Record<string, unknown>>;
  try {
    cfg = readAllConfig(configPaths);
  } catch {
    return 0;
  }
  const date = dateKeyOf(now);
  // 先按内置默认（main 条目）判断今天有没有节日；各宠物条目若关闭则跳过。
  const hit = festivalOf(now);
  if (!hit) return 0;
  const last = readLast(userRoot);
  if (last && last.date === date && last.name === hit.entry.name) return 0;

  let delivered = 0;
  for (const pet of flattenPetList(cfg)) {
    const petId = String(pet.id ?? '');
    if (!petId) continue;
    const found = findPetInstance(cfg, petId);
    if (!found) continue;
    const params = readFestivalParams(found.conf.festival);
    const cue = resolveFestival(now, params);
    if (!cue) continue;
    const meme =
      found.conf.bubbleImageEnabled !== false
        ? pickMeme(readMemePool(found.conf.memes, memeDirsFor(found.entry)))
        : undefined;
    // say 显式 anim=false：节日动画另走 anim 叶子，避免被 events.whisper 的随机动画顶掉。
    state.writePet(petId, 'say', {
      text: cue.text,
      ...(meme ? { image: meme.name } : {}),
      anim: false,
    });
    if (cue.anim && animExists(found.conf.animations, cue.anim)) {
      state.writePet(petId, 'anim', { name: cue.anim });
    }
    log.info(
      `[dsh-zdd-pet] 节日演出 pet=${petId}（${cue.name}）：「${cue.text}」` + (cue.anim ? ` 动画=${cue.anim}` : ''),
    );
    delivered += 1;
  }
  if (delivered > 0) writeLast(userRoot, { date, name: hit.entry.name });
  return delivered;
}
