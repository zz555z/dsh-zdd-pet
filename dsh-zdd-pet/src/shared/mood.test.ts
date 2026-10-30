/**
 * 心情系统纯逻辑单测：档位判定、时间衰减、夹取与配置解析。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  clampMood,
  decayMood,
  DEFAULT_MOOD,
  moodLabel,
  moodTextPool,
  moodTier,
  moodValid,
  readMoodParams,
} from './mood.ts';

describe('clampMood —— 夹到 0~100 整数', () => {
  test('越界/非法/小数', () => {
    assert.equal(clampMood(-5), 0);
    assert.equal(clampMood(150), 100);
    assert.equal(clampMood(60.7), 61);
    assert.equal(clampMood(Number.NaN), 0);
  });
});

describe('moodTier —— 三档', () => {
  test('阈值边界：< low 低落、> high 开心、其余平常', () => {
    assert.equal(moodTier(10, 30, 70), 'low');
    assert.equal(moodTier(30, 30, 70), 'normal');
    assert.equal(moodTier(50, 30, 70), 'normal');
    assert.equal(moodTier(70, 30, 70), 'normal');
    assert.equal(moodTier(71, 30, 70), 'high');
  });
});

describe('decayMood —— 随时间衰减', () => {
  test('每小时掉 decayPerHour 点', () => {
    assert.equal(decayMood(80, 3_600_000, 4), 76); // 1 小时 -4
    assert.equal(decayMood(80, 2 * 3_600_000, 5), 70); // 2 小时 -10
  });
  test('不衰减的情况：elapsed<=0 / rate<=0 / 非法', () => {
    assert.equal(decayMood(80, 0, 4), 80);
    assert.equal(decayMood(80, -100, 4), 80);
    assert.equal(decayMood(80, 3_600_000, 0), 80);
  });
  test('衰减不会低于 0', () => {
    assert.equal(decayMood(5, 100 * 3_600_000, 4), 0);
  });
});

describe('moodLabel', () => {
  test('档位中文', () => {
    assert.equal(moodLabel('low'), '有点闷');
    assert.equal(moodLabel('normal'), '还不错');
    assert.equal(moodLabel('high'), '超开心');
  });
});

describe('readMoodParams —— 配置解析', () => {
  test('缺省/非法 → 默认', () => {
    const p = readMoodParams(undefined);
    assert.equal(p.enabled, true);
    assert.equal(p.initial, 60);
    assert.equal(p.decayPerHour, 4);
  });
  test('合法值被采纳，非法子项回落默认', () => {
    const p = readMoodParams({
      enabled: false,
      initial: 20,
      touchGain: 8,
      low: 10,
      high: 90,
      happyAnim: '撒娇',
      sadAnim: '叹气',
      texts: { low: ['a', '', 1], normal: [], high: ['b'] },
    });
    assert.equal(p.enabled, false);
    assert.equal(p.initial, 20);
    assert.equal(p.touchGain, 8);
    assert.equal(p.happyAnim, '撒娇');
    assert.equal(p.sadAnim, '叹气');
    assert.deepEqual(p.texts.low, ['a']); // 空串/非字符串被滤掉
    assert.deepEqual(p.texts.high, ['b']);
  });
});

describe('moodTextPool —— 档位台词池与 clickTexts 回退', () => {
  test('档位池非空 → 用档位池', () => {
    const p = { ...DEFAULT_MOOD, texts: { low: ['闷'], normal: [], high: ['开心'] } };
    assert.deepEqual(moodTextPool(p, 'high', ['兜底']), ['开心']);
  });
  test('档位池为空 → 回退 clickTexts', () => {
    const p = { ...DEFAULT_MOOD, texts: { low: [], normal: [], high: [] } };
    assert.deepEqual(moodTextPool(p, 'normal', ['兜底']), ['兜底']);
  });
  test('心情关闭 → 永远回退 clickTexts', () => {
    const p = { ...DEFAULT_MOOD, enabled: false };
    assert.deepEqual(moodTextPool(p, 'high', ['兜底']), ['兜底']);
  });
});

describe('moodValid —— mood 段校验', () => {
  test('合法默认值通过', () => {
    assert.equal(moodValid(DEFAULT_MOOD), true);
  });
  test('缺 enabled / 数值越界 / 非对象 → 非法', () => {
    assert.equal(moodValid({ ...DEFAULT_MOOD, enabled: undefined }), false);
    assert.equal(moodValid({ ...DEFAULT_MOOD, initial: 101 }), false);
    assert.equal(moodValid({ ...DEFAULT_MOOD, decayPerHour: -1 }), false);
    assert.equal(moodValid(null), false);
  });
});
