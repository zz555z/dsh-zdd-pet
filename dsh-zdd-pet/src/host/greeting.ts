/**
 * 启动吉祥话：每次 DSH 启动时，让宠物说一句吉利话（带表情包）。
 *
 * 两种模式（配置 greeting.mode）：
 *   - pool（默认）：首次调模型预生成一批（greeting.poolSize 句，默认 100）存进
 *     ~/.dsh/dsh-zdd-pet/greeting-pool.json；之后每次启动从池里随机抽一句，不再调模型（省 token）。
 *     池文件缺失 / 损坏 / 空 → 重新生成一次；生成失败 → 内置兜底。
 *   - live：每次启动都现调模型生成一句；失败 → 内置兜底。
 * 任一步失败都不影响插件启动（静默 + 日志），保证「一定开口」（兜底吉祥话）。
 * @module dsh-zdd-pet/src/host/greeting
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenPetList, readAllConfig, findPetInstance } from './config.ts';
import { composeSystemPrompt, petPersona } from './persona.ts';
import { pickMeme, readMemePool } from './memes.ts';
import { generateWhisper } from './whisper.ts';
import { DEFAULT_GREETING } from '../shared/greeting.ts';
import type { GreetingParams } from '../shared/types.ts';
import type { HostSetup } from './plugin/setup.ts';

/** 启动吉祥话所需依赖。 */
export type GreetingDeps = {
  ctx: { agentDefaultModel: { currentSelection(): { provider: string; model: string } }; llm?: unknown };
} & Pick<HostSetup, 'configPaths'> &
  Pick<HostSetup, 'state'> &
  Pick<HostSetup, 'log'> &
  Pick<HostSetup, 'memeDirsFor'> &
  Pick<HostSetup, 'userRoot'>;

/** 池文件：存预生成的一批吉祥话（JSON 字符串数组），位于数据根下。 */
const POOL_FILE = 'greeting-pool.json';

/** 内置兜底吉祥话（模型不可用 / 池空时用，保证一定开口）。 */
const FALLBACK_GREETINGS = [
  '开工大吉！今天也顺顺利利呀～',
  '恭喜发财、事事顺心！',
  '开张大吉，主人今天也元气满满！',
  '好运连连，万事胜意～',
];

/** 生成「一批吉祥话」的指令（pool 模式）：让模型每行一句，便于拆分。 */
function poolPrompt(n: number): string {
  return (
    `生成 ${n} 句吉祥话（讨口彩、喜庆、祝福），每句一行、不要编号、不要解释、不要空行。` +
    '每句 20 字以内，像过年拜年那样吉利。'
  );
}

/** live 模式生成「一句」的指令。 */
const LIVE_PROMPT =
  '说一句吉利、喜庆、带点祝福的开场话，像过年拜年那样讨口彩，20 字以内，一句就好，不要解释、不要提你是 AI。';

/** 解析 greeting 段；非法 / 缺失 → 用默认。 */
function readGreetingConf(conf: Record<string, unknown> | undefined): GreetingParams {
  const g = conf?.greeting as Record<string, unknown> | undefined;
  if (!g || typeof g !== 'object') return { ...DEFAULT_GREETING };
  const mode = g.mode === 'live' ? 'live' : 'pool';
  const n = Number(g.poolSize);
  return {
    enabled: g.enabled !== false,
    mode,
    poolSize: Number.isInteger(n) && n > 0 ? n : DEFAULT_GREETING.poolSize,
  };
}

/** 把模型返回的整段文本拆成独立句子（按换行 + 去编号/空行），最多取 size 句。 */
function splitPool(text: string, size: number): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+[.、)\s]*/, '').trim()) // 去行首编号
    .filter((line) => line !== '')
    .slice(0, size);
}

/**
 * 调模型生成一批吉祥话并写入池文件；返回可用文案数组（失败返回空，调用方兜底）。
 * @returns 生成成功的句子（去重、非空）；失败 / 全空 → []。
 */
async function buildPool(deps: GreetingDeps, system: string, size: number): Promise<string[]> {
  const { ctx, log, userRoot } = deps;
  const result = await generateWhisper(ctx, system, undefined, undefined, poolPrompt(size));
  if (!result.ok) {
    log.warn('[dsh-zdd-pet] 吉祥话池生成失败 reason=' + result.reason);
    return [];
  }
  const pool = Array.from(new Set(splitPool(result.text, size)));
  if (pool.length === 0) return [];
  try {
    writeFileSync(join(userRoot, POOL_FILE), JSON.stringify(pool, null, 2), 'utf8');
  } catch (e) {
    log.warn('[dsh-zdd-pet] 吉祥话池写盘失败：' + (e instanceof Error ? e.message : String(e)));
  }
  return pool;
}

/** 读池文件；不存在 / 损坏 / 空 → []。 */
function readPool(userRoot: string): string[] {
  const file = join(userRoot, POOL_FILE);
  if (!existsSync(file)) return [];
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((s): s is string => typeof s === 'string' && s.trim() !== '');
  } catch {
    return [];
  }
}

/**
 * 每次启动问候：按配置模式（pool 抽一句 / live 现生成）给每只宠物投一句吉祥话。
 *
 * @param deps - 装配期依赖。
 * @returns 是否启用了问候并投递（未启用 / 无宠物 → false）。
 */
export async function maybeGreeting(deps: GreetingDeps): Promise<boolean> {
  const { ctx, configPaths, state, log, memeDirsFor, userRoot } = deps;
  let cfg: Record<string, Record<string, unknown>>;
  try {
    cfg = readAllConfig(configPaths);
  } catch {
    return false;
  }
  const pets = flattenPetList(cfg).filter((p) => String(p.id ?? '') !== '');
  if (pets.length === 0) return false;

  for (const pet of pets) {
    const petId = String(pet.id ?? '');
    const found = findPetInstance(cfg, petId);
    if (!found) continue;
    const greeting = readGreetingConf(found.conf);
    if (!greeting.enabled) continue; // 该条目关闭了吉祥话

    const system = composeSystemPrompt({
      prompt: petPersona(found.conf, found.pet),
      name: String(found.pet.name ?? ''),
      id: petId,
      now: new Date(),
    });

    let text: string | undefined;
    if (greeting.mode === 'live') {
      // live：每次现调模型生成一句
      const r = await generateWhisper(ctx, system, undefined, undefined, LIVE_PROMPT);
      if (r.ok) text = r.text;
      else log.warn('[dsh-zdd-pet] 启动吉祥话(live)生成失败，用兜底 reason=' + r.reason);
    } else {
      // pool：先从池抽；池空则生成一批再抽
      let pool = readPool(userRoot);
      if (pool.length === 0) pool = await buildPool(deps, system, greeting.poolSize);
      if (pool.length > 0) text = pool[Math.floor(Math.random() * pool.length)];
      else log.warn('[dsh-zdd-pet] 吉祥话池为空且生成失败，用兜底');
    }
    if (!text) text = FALLBACK_GREETINGS[Math.floor(Math.random() * FALLBACK_GREETINGS.length)]!;

    // 配图：开启配图且池非空时，从该宠物自己的表情包池抽一张（与碎碎念同源）
    const meme =
      found.conf.whisperImageEnabled === true
        ? pickMeme(readMemePool(found.conf.memes, memeDirsFor(found.entry)))
        : undefined;
    state.writePet(petId, 'say', meme ? { text, image: meme.name } : { text });
    log.info(`[dsh-zdd-pet] 启动吉祥话 pet=${petId}（${greeting.mode}）：「${text}」`);
  }
  return true;
}
