/**
 * 工作状态纯逻辑测试：快照解析（含后加的 progress 字段）与进度展示。
 *
 * 钉住三件事：
 *   ① toWorkStatus 对 progress 的容错：合法 done/total 才采纳，非法 / 缺省 / 超界都归一成 null，
 *      保证老 host / 老快照与新渲染混搭不炸（向后兼容）。
 *   ② hasTask 判据：有文案或有进度即「有任务」，两端气泡槽位据此让位。
 *   ③ progressBar / progressText：total ≤ 10 一格一条、> 10 归一到 10 格；满格/全空端点精确。
 *   ④ toWorkStatus 对 sessionId 的容错：合法会话 id 才采纳，外部槽 / 老宿主 / 哨兵值都归一成 null。
 *
 * 用 Node 内置 test runner（node:test），不引入任何 npm 依赖。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { hasTask, PROGRESS_BAR_MAX_SLOTS, progressBar, progressText, toWorkStatus } from './work-status.ts';

describe('toWorkStatus —— 快照解析（含 progress 向后兼容）', () => {
  test('合法 progress：done/total 归一成对象', () => {
    const snap = toWorkStatus({ state: 'working', task: '干活', progress: { done: 2, total: 5 } });
    assert.deepEqual(snap?.progress, { done: 2, total: 5 });
  });

  test('缺 progress 字段（老快照）→ null，其余字段照常', () => {
    const snap = toWorkStatus({ state: 'thinking', task: null });
    assert.deepEqual(snap, { state: 'thinking', task: null, progress: null, sessionId: null });
  });

  test('progress 非法（total<=0 / 非整数 / 负数 done / 非对象）→ null', () => {
    assert.equal(toWorkStatus({ state: 'working', progress: { done: 0, total: 0 } })?.progress, null);
    assert.equal(toWorkStatus({ state: 'working', progress: { done: 1, total: 2.5 } })?.progress, null);
    assert.equal(toWorkStatus({ state: 'working', progress: { done: -1, total: 3 } })?.progress, null);
    assert.equal(toWorkStatus({ state: 'working', progress: 'x' })?.progress, null);
  });

  test('done 超出 total → 夹到 total（不出现「6/5」）', () => {
    assert.deepEqual(toWorkStatus({ progress: { done: 6, total: 5 } })?.progress, { done: 5, total: 5 });
  });
});

describe('hasTask —— 有文案或进度即视为「有任务」', () => {
  test('有任务文案 / 有进度 / 两者都有 → true', () => {
    assert.equal(hasTask({ task: 'x', progress: null }), true);
    assert.equal(hasTask({ task: null, progress: { done: 1, total: 3 } }), true);
    assert.equal(hasTask({ task: 'x', progress: { done: 1, total: 3 } }), true);
  });

  test('都空 / null 快照 → false', () => {
    assert.equal(hasTask({ task: null, progress: null }), false);
    assert.equal(hasTask(null), false);
  });
});

describe('progressBar / progressText —— 方块进度条', () => {
  test('total ≤ 10：一格一条，done/total 满格数精确', () => {
    assert.equal(progressBar({ progress: { done: 2, total: 5 } }), '▰▰▱▱▱');
    assert.equal(progressBar({ progress: { done: 0, total: 3 } }), '▱▱▱');
    assert.equal(progressBar({ progress: { done: 3, total: 3 } }), '▰▰▰');
  });

  test('total > 10：归一到 10 格，端点精确（全空/满格）', () => {
    assert.equal(progressBar({ progress: { done: 0, total: 40 } }), '▱'.repeat(PROGRESS_BAR_MAX_SLOTS));
    assert.equal(progressBar({ progress: { done: 40, total: 40 } }), '▰'.repeat(PROGRESS_BAR_MAX_SLOTS));
    // 20/40 = 一半 → 5 格
    assert.equal(progressBar({ progress: { done: 20, total: 40 } }), '▰▰▰▰▰▱▱▱▱▱');
  });

  test('无进度 → null', () => {
    assert.equal(progressBar({ progress: null }), null);
    assert.equal(progressBar(null), null);
  });

  test('progressText = 方块 + 两空格 + 数字', () => {
    assert.equal(progressText({ progress: { done: 2, total: 5 } }), '▰▰▱▱▱  2/5');
    assert.equal(progressText({ progress: null }), null);
  });

  describe('toWorkStatus —— sessionId 解析', () => {
    test('带 sessionId → 原样保留，供点气泡跳会话', () => {
      const snap = toWorkStatus({ state: 'working', task: '改文件', sessionId: 'session-abc' });
      assert.equal(snap?.sessionId, 'session-abc');
    });

    test('缺字段 / null（老宿主或外部槽）→ null，气泡因此不可点', () => {
      assert.equal(toWorkStatus({ state: 'working', task: null })?.sessionId, null);
      assert.equal(toWorkStatus({ state: 'working', task: null, sessionId: null })?.sessionId, null);
    });

    test('空串 / 哨兵 unknown / 非字符串 → null（不让气泡跳到不存在的地方）', () => {
      for (const sessionId of ['', 'unknown', 42, {}, true]) {
        assert.equal(toWorkStatus({ state: 'working', task: null, sessionId })?.sessionId, null);
      }
    });

    test('空闲快照也带 sessionId: null', () => {
      assert.deepEqual(toWorkStatus({ state: null, task: null }), {
        state: null,
        task: null,
        progress: null,
        sessionId: null,
      });
    });
  });
});
