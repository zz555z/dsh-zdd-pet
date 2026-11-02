/**
 * 长期记忆（事实）读写：并发抽取不互相覆盖 + 合并去重上限。
 *
 * 用假 ctx.llm 返回固定/递增句式，模拟连发多轮对话触发并发抽取；断言事实不丢。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createMemoryFacts } from './memory-facts.ts';
import { MEMORY_FACT_MAX, type MemoryFact } from '../../shared/proactive.ts';

/** 假 ctx：stream 每次调用取 replies 里的下一条（并发时各拿不同文本）。 */
function fakeCtx(replies: string[]): never {
  let i = 0;
  return {
    agentDefaultModel: { currentSelection: () => ({ provider: 'p', model: 'm' }) },
    llm: {
      stream: () => {
        const reply = replies[Math.min(i, replies.length - 1)];
        i += 1;
        return (async function* () {
          yield { type: 'text-delta', index: 0, text: reply };
        })();
      },
    },
  } as never;
}

const log = { info: () => {}, warn: () => {}, error: () => {} } as unknown as Parameters<
  typeof createMemoryFacts
>[0]['log'];
const root = () => mkdtempSync(join(tmpdir(), 'facts-'));

function readFactsFile(userRoot: string): Record<string, MemoryFact[]> {
  return JSON.parse(readFileSync(join(userRoot, 'facts.json'), 'utf8')) as Record<string, MemoryFact[]>;
}

describe('memory-facts —— 抽取落盘', () => {
  test('单次抽取正确落盘', async () => {
    const userRoot = root();
    const m = createMemoryFacts({ userRoot, ctx: fakeCtx(['用户是程序员']), log });
    assert.equal(await m.extractFacts('main', 'sys', 'u', 'a'), 1);
    assert.deepEqual(
      readFactsFile(userRoot).main?.map((f) => f.text),
      ['用户是程序员'],
    );
  });

  test('并发抽取不同事实：串行队列保证两份都在（不互相覆盖）', async () => {
    const userRoot = root();
    // 两条不同回复：同一实例并发两次抽取，各拿到不同事实。
    const m = createMemoryFacts({ userRoot, ctx: fakeCtx(['事实甲', '事实乙']), log });
    await Promise.all([m.extractFacts('main', 'sys', 'u1', 'a1'), m.extractFacts('main', 'sys', 'u2', 'a2')]);
    const texts = (readFactsFile(userRoot).main ?? []).map((f) => f.text).sort();
    assert.deepEqual(texts, ['事实乙', '事实甲']);
  });

  test('超过上限按最旧淘汰', async () => {
    const userRoot = root();
    const many = Array.from({ length: MEMORY_FACT_MAX }, (_, i) => ({ text: 'old' + i, ts: i }));
    writeFileSync(join(userRoot, 'facts.json'), JSON.stringify({ main: many }));
    const m = createMemoryFacts({ userRoot, ctx: fakeCtx(['x']), log });
    assert.equal(await m.extractFacts('main', 'sys', 'u', 'a'), 1);
    const all = readFactsFile(userRoot);
    assert.equal(all.main?.length, MEMORY_FACT_MAX);
    assert.equal(all.main?.[all.main.length - 1]!.text, 'x');
  });
});
