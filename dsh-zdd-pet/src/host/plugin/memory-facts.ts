/**
 * 长期记忆（事实）：从对话里抽取「可长期记住的事实」并持久化，下次对话拼进 system prompt。
 *
 * 与 memory.json（逐轮原文，只做上下文窗口）分工：这里存的是**蒸馏后的事实**（你是谁、在做
 * 什么项目、偏好、常提的人/事），条目少而精，长期有效，不随轮数滚出窗口。
 *
 * 存储：userRoot/facts.json，结构 { <petId>: MemoryFact[] }。每只宠物独立，上限 MEMORY_FACT_MAX 条
 * （超出按最旧淘汰）。抽取调模型，失败静默（不影响对话本身）。
 * @module dsh-zdd-pet/src/host/plugin/memory-facts
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateWhisper } from '../whisper.ts';
import { MEMORY_FACT_MAX, type MemoryFact } from '../../shared/proactive.ts';
import type { ModelRef } from '../model-selection.ts';
import type { FileLogger } from '../log-file.ts';

/** 抽取事实的指令：要求每行一条、简短、只留长期有用的。 */
const EXTRACT_PROMPT =
  '下面是一段用户和你的对话。请从中提炼「值得长期记住的用户事实」——比如用户的身份/职业、在做的项目、' +
  '明确的偏好、反复提到的人或事。每条一行、20 字以内、只写事实本身（不要「用户说」这类前缀），' +
  '只保留长期有用的；如果这段对话没有值得长期记住的事实，就只回复四个字：无。\n\n对话：\n';

/** 长期记忆的输入。 */
export interface MemoryFactsInput {
  /** 数据根。 */
  userRoot: string;
  /** 宿主上下文（注入 llm / agentDefaultModel），抽取时用。 */
  ctx: { agentDefaultModel: { currentSelection(): { provider: string; model: string } }; llm?: unknown };
  /** 日志。 */
  log: FileLogger;
}

type FactsFile = Record<string, MemoryFact[]>;

/** 解析模型返回的抽取文本：按行拆分、去编号/空行，能识别「无」→ []。 */
export function parseFacts(text: string): string[] {
  const t = text.trim();
  if (!t || /^无[。.!！]?$/.test(t)) return [];
  return t
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*\d.、)\s]+/, '').trim())
    .filter((line) => line !== '' && line.length <= 60 && !/^无[。.!！]?$/.test(line));
}

/** 合并新事实到旧列表：去重（完全相同或包含关系视为重复）、追加、截断到上限。 */
/** 合并结果：合并后的列表 + 本次实际新增（去重后、未被上限淘汰前）的条数。 */
export interface MergeResult {
  facts: MemoryFact[];
  added: number;
}

/** 合并新事实到旧列表：去重（完全相同或包含关系视为重复）、追加、截断到上限。 */
export function mergeFacts(old: readonly MemoryFact[], fresh: readonly string[], now: number): MergeResult {
  const out: MemoryFact[] = [...old];
  let added = 0;
  for (const text of fresh) {
    const norm = text.trim();
    if (!norm) continue;
    // 已有某条包含它，或它包含某条 → 视为重复/更新，跳过。
    const dup = out.some((f) => f.text === norm || f.text.includes(norm) || norm.includes(f.text));
    if (dup) continue;
    out.push({ text: norm, ts: now });
    added += 1;
  }
  // 超出上限按最旧淘汰（列表按追加顺序，旧的在前）。
  const facts = out.length > MEMORY_FACT_MAX ? out.slice(out.length - MEMORY_FACT_MAX) : out;
  return { facts, added };
}

/**
 * 长期记忆的读写面。
 */
export function createMemoryFacts(deps: MemoryFactsInput) {
  const { userRoot, ctx, log } = deps;
  const path = join(userRoot, 'facts.json');

  // 写操作串行队列：抽取是「读-改-写」整份 facts.json，连发两轮对话时两个 extractFacts 会并发
  // 读同一份旧文件、后写覆盖前写（丢事实）。所有写都排进这条队列，读写不交错。
  let writeQueue: Promise<unknown> = Promise.resolve();
  const withWriteLock = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = writeQueue.then(fn, fn);
    writeQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };

  const readAll = async (): Promise<FactsFile> => {
    try {
      const raw = await readFile(path, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return parsed as FactsFile;
    } catch {
      return {};
    }
  };

  const writeAll = async (all: FactsFile): Promise<void> => {
    await mkdir(userRoot, { recursive: true });
    const tmp = path + '.tmp-' + process.pid + '-' + Date.now();
    await writeFile(tmp, JSON.stringify(all, null, 2), 'utf8');
    await rename(tmp, path);
  };

  /** 取某宠物的事实列表（只读）。 */
  const readFacts = async (petId: string): Promise<MemoryFact[]> => {
    const all = await readAll();
    const list = all[petId];
    return Array.isArray(list) ? list.filter((f) => f && typeof f.text === 'string') : [];
  };

  /** 拼进 system 提示词的事实段：空列表 → 空串（不占位）。 */
  const factsPromptSection = (facts: readonly MemoryFact[]): string => {
    if (facts.length === 0) return '';
    return '你还记得关于主人的这些事：\n' + facts.map((f) => '- ' + f.text).join('\n');
  };

  /**
   * 从一轮对话里抽取事实并落盘（异步、失败静默）。返回新增的事实条数。
   * @param petId - 宠物 id（分桶）。
   * @param system - 该宠物的人设 system（给抽取一个身份背景）。
   * @param userText - 用户这一轮说的话。
   * @param reply - 宠物的回复。
   * @param preferred - 抽取用的模型（跟随 whisperModel 配置；缺省用当前对话模型）。
   */
  const extractFacts = async (
    petId: string,
    system: string,
    userText: string,
    reply: string,
    preferred?: ModelRef,
  ): Promise<number> => {
    try {
      const dialog = '主人：' + userText + '\n你：' + reply;
      const r = await generateWhisper(ctx, system, undefined, preferred, EXTRACT_PROMPT + dialog);
      if (!r.ok) return 0;
      const fresh = parseFacts(r.text);
      if (fresh.length === 0) return 0;
      // 生成已在锁外完成（耗时的模型调用不阻塞其它写）；只有读-改-写这一小段进串行队列，
      // 保证并发抽取不会互相覆盖。
      return await withWriteLock(async () => {
        const all = await readAll();
        const old = Array.isArray(all[petId]) ? all[petId]!.filter((f) => f && typeof f.text === 'string') : [];
        const { facts: merged, added } = mergeFacts(old, fresh, Date.now());
        if (added <= 0) return 0;
        all[petId] = merged;
        await writeAll(all);
        log.info(`[dsh-zdd-pet] 长期记忆更新 pet=${petId}，新增 ${added} 条（共 ${merged.length}）`);
        return added;
      });
    } catch (e) {
      log.warn('[dsh-zdd-pet] 长期记忆抽取失败：' + (e instanceof Error ? e.message : String(e)));
      return 0;
    }
  };

  return { readFacts, factsPromptSection, extractFacts, path };
}

export type MemoryFacts = ReturnType<typeof createMemoryFacts>;
