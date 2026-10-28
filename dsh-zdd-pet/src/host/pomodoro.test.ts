/**
 * 番茄钟纯逻辑单测 —— 钉住：
 *   ① 默认关闭（enabled 不显式 true 就不开，避免悄悄打扰）；
 *   ② 间隔非法一律回落默认 50 分钟，不会变 0 或 NaN；
 *   ③ 文案可配、可注入随机、空则用默认。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parsePomodoro,
  pickPomodoroText,
  pomodoroMs,
  POMODORO_DEFAULT_INTERVAL_MIN,
  POMODORO_DEFAULT_TEXTS,
  POMODORO_MAX_INTERVAL_MIN,
} from './pomodoro.ts';

describe('parsePomodoro —— 配置解析', () => {
  test('默认关闭：没配 / enabled 非 true → undefined', () => {
    assert.equal(parsePomodoro(undefined), undefined);
    assert.equal(parsePomodoro(null), undefined);
    assert.equal(parsePomodoro({}), undefined);
    assert.equal(parsePomodoro({ intervalMin: 50 }), undefined, '没写 enabled 不开');
    assert.equal(parsePomodoro({ enabled: false }), undefined);
    assert.equal(parsePomodoro({ enabled: 'true' }), undefined, '字符串 true 不算');
  });

  test('enabled:true 才开，间隔缺省 50', () => {
    const c = parsePomodoro({ enabled: true });
    assert.equal(c?.enabled, true);
    assert.equal(c?.intervalMin, POMODORO_DEFAULT_INTERVAL_MIN);
  });

  test('间隔非法 → 回落默认，绝不 0/NaN/负数', () => {
    for (const bad of [0, -5, NaN, Infinity, 'x', null]) {
      const c = parsePomodoro({ enabled: true, intervalMin: bad });
      assert.equal(c?.intervalMin, POMODORO_DEFAULT_INTERVAL_MIN, `intervalMin=${String(bad)}`);
    }
  });

  test('间隔超上限 → 回落默认', () => {
    const c = parsePomodoro({ enabled: true, intervalMin: POMODORO_MAX_INTERVAL_MIN + 1 });
    assert.equal(c?.intervalMin, POMODORO_DEFAULT_INTERVAL_MIN);
  });

  test('合法间隔被采纳', () => {
    assert.equal(parsePomodoro({ enabled: true, intervalMin: 25 })?.intervalMin, 25);
    assert.equal(parsePomodoro({ enabled: true, intervalMin: 90 })?.intervalMin, 90);
  });

  test('文案：空/非法 → 用默认；合法 → 用它', () => {
    assert.deepEqual(parsePomodoro({ enabled: true, texts: [] })?.texts, POMODORO_DEFAULT_TEXTS);
    assert.deepEqual(parsePomodoro({ enabled: true, texts: ['', '  ', 123] })?.texts, POMODORO_DEFAULT_TEXTS);
    assert.deepEqual(parsePomodoro({ enabled: true, texts: ['起来动动'] })?.texts, ['起来动动']);
  });
});

describe('pickPomodoroText / pomodoroMs', () => {
  test('随机可注入：0 → 第一句，接近 1 → 最后一句', () => {
    const c = parsePomodoro({ enabled: true, texts: ['A', 'B', 'C'] })!;
    assert.equal(
      pickPomodoroText(c, () => 0),
      'A',
    );
    assert.equal(
      pickPomodoroText(c, () => 0.99),
      'C',
    );
  });

  test('间隔 → 毫秒，至少 1 分钟', () => {
    assert.equal(pomodoroMs({ enabled: true, intervalMin: 50, texts: [] }), 50 * 60 * 1000);
    assert.equal(pomodoroMs({ enabled: true, intervalMin: 1, texts: [] }), 60 * 1000);
  });
});
