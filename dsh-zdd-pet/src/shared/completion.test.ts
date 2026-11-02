/**
 * 任务完成常驻提示纯逻辑的契约测试：默认值、解析容错、校验。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_COMPLETION, completionValid, readCompletionParams } from './completion.ts';

describe('readCompletionParams / completionValid', () => {
  test('缺省 → 默认（enabled + holdUntilFocus 都开）', () => {
    const p = readCompletionParams(undefined);
    assert.deepEqual(p, DEFAULT_COMPLETION);
  });

  test('显式关闭 holdUntilFocus 被读到', () => {
    assert.equal(readCompletionParams({ enabled: true, holdUntilFocus: false }).holdUntilFocus, false);
  });

  test('enabled 必须布尔、holdUntilFocus 可缺省', () => {
    assert.equal(completionValid({ enabled: true }), true);
    assert.equal(completionValid({ enabled: true, holdUntilFocus: false }), true);
    assert.equal(completionValid({ enabled: 'x' }), false);
    assert.equal(completionValid({ enabled: true, holdUntilFocus: 'no' }), false);
    assert.equal(completionValid(null), false);
  });
});
