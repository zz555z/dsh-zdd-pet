/**
 * 气泡时长策略单测：长度 → 时长映射的边界与上下界。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { sayBubbleDurationMs, SAY_BUBBLE_MAX_MS, SAY_BUBBLE_MIN_MS } from './timings.ts';

describe('sayBubbleDurationMs —— 按文本长度给气泡时长', () => {
  test('短文本取下界 10s', () => {
    assert.equal(sayBubbleDurationMs(''), SAY_BUBBLE_MIN_MS);
    assert.equal(sayBubbleDurationMs('你好'), SAY_BUBBLE_MIN_MS);
  });

  test('中等长度按 3s + 250ms/字', () => {
    // 40 字：3000 + 40*250 = 13000
    assert.equal(sayBubbleDurationMs('字'.repeat(40)), 13_000);
  });

  test('长文本封顶 60s', () => {
    assert.equal(sayBubbleDurationMs('字'.repeat(500)), SAY_BUBBLE_MAX_MS);
  });

  test('emoji 按码点计 1 个', () => {
    // 4 个 emoji：3000 + 4*250 = 4000，仍小于下界 → 10s
    assert.equal(sayBubbleDurationMs('🐟🐟🐟🐟'), SAY_BUBBLE_MIN_MS);
  });
});
