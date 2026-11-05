/** 番茄钟真实引擎的计时、配置关闭与卸载契约测试。 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, test, type TestContext } from 'node:test';
import { createPomodoroEngine } from './pomodoro-engine.ts';
import { PollStateStore } from './state.ts';

function setup(context: TestContext, autoStartBreak = true) {
  context.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1000 });
  const root = mkdtempSync(join(tmpdir(), 'pomodoro-engine-'));
  const defaultFile = join(root, 'default.jsonc');
  const writeConfig = (enabled: boolean) =>
    writeFileSync(
      defaultFile,
      JSON.stringify({
        bubbleImageEnabled: false,
        pets: [{ id: 'main', name: '鱼' }],
        pomodoro: { enabled, intervalMin: 1, breakMin: 1, autoStartBreak },
      }),
    );
  writeConfig(true);
  const state = new PollStateStore();
  const completed: string[] = [];
  const engine = createPomodoroEngine({
    configPaths: { defaultFile, userFile: join(root, 'user.jsonc'), petDir: join(root, 'pets') },
    state,
    log: {
      info() {},
      warn() {},
      error() {},
      debug() {},
      file: '',
      isFileLogger: true,
      async flush() {},
      dispose() {},
    },
    memeDirsFor: () => [],
    pickPetMeme: () => undefined,
    deliverCue: (petId, payload) => !!state.publishSay(petId, { ...payload }, { source: 'pomodoro' }),
    onFocusComplete: (petId) => completed.push(petId),
  });
  context.after(() => {
    engine.dispose();
    state.cancelAll();
    rmSync(root, { recursive: true, force: true });
  });
  const say = () => state.read().pets.main?.say.data as { text?: string; clear?: boolean; hold?: boolean };
  return { engine, state, completed, writeConfig, say };
}

describe('createPomodoroEngine', () => {
  test('阶段推进：专注自然结束 → 完成回调与休息倒计时', (context) => {
    const { engine, completed, say } = setup(context);
    assert.deepEqual(engine.control('start', 'main'), { ok: true });
    assert.match(say().text ?? '', /专注中.*01:00/);
    context.mock.timers.tick(60_000);
    assert.deepEqual(completed, ['main']);
    assert.match(say().text ?? '', /休息中.*01:00/);
  });

  for (const action of ['stop', 'reset'] as const) {
    test(`关闭后${action}：配置已关闭 → 成功清理且旧计时不复活`, (context) => {
      const { engine, completed, writeConfig, say, state } = setup(context);
      engine.control('start', 'main');
      writeConfig(false);
      assert.deepEqual(engine.control(action, 'main'), { ok: true });
      assert.deepEqual(say(), { clear: true });
      const counter = state.read().counter;
      writeConfig(true);
      context.mock.timers.tick(120_000);
      assert.equal(state.read().counter, counter, '已停止的计时器不应再投递');
      assert.deepEqual(completed, []);
    });
  }

  for (const mode of ['running', 'paused', 'waiting-break'] as const) {
    test(`关闭配置：${mode} → 五秒内清理且重新开启不恢复旧阶段`, (context) => {
      const { engine, completed, writeConfig, say, state } = setup(context, mode !== 'waiting-break');
      engine.control('start', 'main');
      if (mode === 'paused') engine.control('pause', 'main');
      if (mode === 'waiting-break') context.mock.timers.tick(60_000);
      writeConfig(false);
      context.mock.timers.tick(5000);
      assert.deepEqual(say(), { clear: true });
      const counter = state.read().counter;
      writeConfig(true);
      context.mock.timers.tick(120_000);
      assert.equal(state.read().counter, counter, '关闭后应释放所有计时器');
      assert.equal(completed.length, mode === 'waiting-break' ? 1 : 0);
      engine.control('status', 'main');
      assert.match(say().text ?? '', /空闲中/);
    });
  }

  test('暂停继续：暂停时间不消耗剩余 → 继续后按剩余时长结束', (context) => {
    const { engine, completed, say } = setup(context);
    engine.control('start', 'main');
    context.mock.timers.tick(10_000);
    engine.control('pause', 'main');
    context.mock.timers.tick(60_000);
    assert.match(say().text ?? '', /已暂停.*00:50/);
    assert.deepEqual(completed, []);
    engine.control('resume', 'main');
    context.mock.timers.tick(49_999);
    assert.deepEqual(completed, []);
    context.mock.timers.tick(1);
    assert.deepEqual(completed, ['main']);
  });

  for (const paused of [false, true]) {
    test(`卸载清理：${paused ? '暂停' : '运行'}后卸载 → 清除倒计时并拒绝后续动作`, (context) => {
      const { engine, state, completed, say } = setup(context);
      engine.control('start', 'main');
      if (paused) engine.control('pause', 'main');
      engine.dispose();
      assert.deepEqual(say(), { clear: true });
      const counter = state.read().counter;
      engine.dispose();
      context.mock.timers.tick(120_000);
      assert.equal(state.read().counter, counter);
      assert.deepEqual(completed, []);
      assert.equal(engine.control('start', 'main').reason, 'disposed');
    });
  }

  test('清理归属：其他来源覆盖倒计时 → 停止只清理番茄钟来源', (context) => {
    const { engine, state, say } = setup(context);
    engine.control('start', 'main');
    state.publishSay('main', { text: '等待确认', hold: true }, { source: 'approval', id: 'approval' });
    engine.control('stop', 'main');
    assert.equal(say().text, '等待确认');
  });
});
