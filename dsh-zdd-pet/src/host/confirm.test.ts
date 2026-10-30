/**
 * 「等待用户确认」文案的纯逻辑单测。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { CONFIRM_TEXT_MAX, confirmText } from './confirm.ts';

describe('confirmText —— 确认气泡文案', () => {
  test('无细节：按场景给通用说法', () => {
    assert.equal(confirmText('approval'), '有个操作需要你确认一下～');
    assert.equal(confirmText('question'), '有个问题想问你，等你选一下～');
  });

  test('有细节：拼进文案并按上限截断', () => {
    assert.equal(confirmText('approval', 'pwsh'), '有个操作需要你确认：pwsh');
    assert.equal(confirmText('question', ' 选哪个？ '), '有个问题想问你：选哪个？');
    const long = 'x'.repeat(100);
    const out = confirmText('question', long);
    assert.ok(Array.from(out).length <= CONFIRM_TEXT_MAX + 1, '超长要截断（含省略号）');
    assert.ok(out.endsWith('…'));
  });
});
