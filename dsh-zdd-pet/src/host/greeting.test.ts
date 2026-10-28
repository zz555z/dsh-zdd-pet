/**
 * 启动吉祥话的契约测试：pool 模式生成池并随机抽、池复用不再调模型、live 模式现生成、失败兜底。
 *
 * 用临时数据根 + 假 ctx（llm.stream 直接产出文本或抛错），不依赖真实模型。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { maybeGreeting } from './greeting.ts';
import { PollStateStore } from './state.ts';

const log = {
  info() {},
  warn() {},
  error() {},
  debug() {},
} as unknown as Parameters<typeof maybeGreeting>[0]['log'];

/** 假 ctx：每次 stream 返回固定文本；text=null 时抛错。计数调用次数。 */
function fakeCtx(text: string | null): {
  ctx: Parameters<typeof maybeGreeting>[0]['ctx'];
  calls: () => number;
} {
  let n = 0;
  const llm = {
    resolveModelInfo: async () => ({}),
    stream: (): AsyncIterable<unknown> =>
      (async function* () {
        n += 1;
        if (text === null) throw new Error('no model');
        yield { type: 'text-delta', index: 0, text };
      })(),
  };
  return {
    ctx: { agentDefaultModel: { currentSelection: () => ({ provider: 'p', model: 'm' }) }, llm },
    calls: () => n,
  };
}

/** 写一份最小配置（一个宠物，greeting 可配）。 */
function setup(greeting: object) {
  const userRoot = mkdtempSync(join(tmpdir(), 'greet-'));
  const defFile = join(userRoot, 'default.jsonc');
  writeFileSync(
    defFile,
    JSON.stringify({
      greeting,
      pets: [
        {
          id: 'main',
          name: '鱼',
          size: 300,
          balanceEnabled: false,
          display: 'desktop',
          position: { corner: 'bottom-right', marginX: 24, marginY: 20 },
        },
      ],
    }),
    'utf8',
  );
  const configPaths = {
    defaultFile: defFile,
    userFile: join(userRoot, 'main-config.jsonc'),
    legacyUserFile: join(userRoot, 'x.json'),
  };
  return { userRoot, configPaths };
}

/** 读某宠物 say 叶子的文本。 */
function sayText(state: PollStateStore): string | undefined {
  const snap = state.read() as { pets: Record<string, { say?: { data?: { text?: string } } }> };
  return snap.pets.main?.say?.data?.text;
}

describe('maybeGreeting —— 启动吉祥话', () => {
  test('pool 模式：首次生成池并写入文件，投递一句来自池的文案', async () => {
    const { userRoot, configPaths } = setup({ enabled: true, mode: 'pool', poolSize: 100 });
    const state = new PollStateStore();
    const { ctx } = fakeCtx('一帆风顺\n二龙腾飞\n三阳开泰');
    await maybeGreeting({ ctx, configPaths, state, log, memeDirsFor: () => [], userRoot } as never);
    const poolFile = join(userRoot, 'greeting-pool.json');
    assert.ok(existsSync(poolFile), '应写入池文件');
    const pool = JSON.parse(readFileSync(poolFile, 'utf8')) as string[];
    assert.deepEqual(pool, ['一帆风顺', '二龙腾飞', '三阳开泰']);
    assert.ok(pool.includes(sayText(state) ?? ''), '气泡文本应来自池');
  });

  test('pool 模式：池已存在则复用，不再调模型', async () => {
    const { userRoot, configPaths } = setup({ enabled: true, mode: 'pool', poolSize: 100 });
    writeFileSync(join(userRoot, 'greeting-pool.json'), JSON.stringify(['大吉大利']), 'utf8');
    const state = new PollStateStore();
    const fake = fakeCtx('不该被调用');
    await maybeGreeting({ ctx: fake.ctx, configPaths, state, log, memeDirsFor: () => [], userRoot } as never);
    assert.equal(fake.calls(), 0, '复用池不应调模型');
    assert.equal(sayText(state), '大吉大利');
  });

  test('live 模式：每次调模型生成一句', async () => {
    const { userRoot, configPaths } = setup({ enabled: true, mode: 'live', poolSize: 100 });
    const state = new PollStateStore();
    const fake = fakeCtx('恭喜发财');
    await maybeGreeting({ ctx: fake.ctx, configPaths, state, log, memeDirsFor: () => [], userRoot } as never);
    assert.equal(fake.calls(), 1);
    assert.equal(sayText(state), '恭喜发财');
  });

  test('模型失败用兜底，仍投递非空文案、不抛', async () => {
    const { userRoot, configPaths } = setup({ enabled: true, mode: 'live', poolSize: 100 });
    const state = new PollStateStore();
    const fake = fakeCtx(null);
    await maybeGreeting({ ctx: fake.ctx, configPaths, state, log, memeDirsFor: () => [], userRoot } as never);
    assert.ok((sayText(state) ?? '').length > 0, '兜底文案非空');
  });

  test('enabled=false：不投递', async () => {
    const { userRoot, configPaths } = setup({ enabled: false, mode: 'pool', poolSize: 100 });
    const state = new PollStateStore();
    const fake = fakeCtx('不该出现');
    await maybeGreeting({ ctx: fake.ctx, configPaths, state, log, memeDirsFor: () => [], userRoot } as never);
    assert.equal(sayText(state), undefined);
  });
});
