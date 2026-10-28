/**
 * shared/pomodoro 的校验与默认值单测：钉住「设置页与宿主共用同一套规则」这条不变式。
 *
 * 重点：pomodoroValid 必须与宿主 save.ts 的 acceptance 完全一致——设置页放行的值宿主不会 400，
 * 设置页拦下的值宿主也会拒。间隔区间 1~1440，enabled 必须布尔。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_POMODORO,
  POMODORO_DEFAULT_INTERVAL_MIN,
  POMODORO_MAX_INTERVAL_MIN,
  POMODORO_MIN_INTERVAL_MIN,
  pomodoroValid,
} from './pomodoro.ts';

describe('pomodoroValid —— 番茄钟段校验', () => {
  test('合法：布尔 enabled + 区间内间隔', () => {
    assert.equal(pomodoroValid({ enabled: true, intervalMin: 50 }), true);
    assert.equal(pomodoroValid({ enabled: false, intervalMin: POMODORO_MIN_INTERVAL_MIN }), true);
    assert.equal(pomodoroValid({ enabled: true, intervalMin: POMODORO_MAX_INTERVAL_MIN }), true);
  });

  test('enabled 必须是布尔（字符串 true 不算）', () => {
    assert.equal(pomodoroValid({ enabled: 'true', intervalMin: 50 }), false);
    assert.equal(pomodoroValid({ intervalMin: 50 }), false);
  });

  test('间隔越界 / 非数字 → 非法', () => {
    assert.equal(pomodoroValid({ enabled: true, intervalMin: 0 }), false);
    assert.equal(pomodoroValid({ enabled: true, intervalMin: POMODORO_MAX_INTERVAL_MIN + 1 }), false);
    assert.equal(pomodoroValid({ enabled: true, intervalMin: Number.NaN }), false);
    assert.equal(pomodoroValid({ enabled: true, intervalMin: 'x' }), false);
  });

  test('非对象 / 数组 / null → 非法', () => {
    assert.equal(pomodoroValid(null), false);
    assert.equal(pomodoroValid([]), false);
    assert.equal(pomodoroValid('x'), false);
  });
});

describe('DEFAULT_POMODORO —— 内置默认', () => {
  test('默认关闭、间隔 50，且本身通过校验', () => {
    assert.equal(DEFAULT_POMODORO.enabled, false);
    assert.equal(DEFAULT_POMODORO.intervalMin, POMODORO_DEFAULT_INTERVAL_MIN);
    assert.equal(pomodoroValid(DEFAULT_POMODORO), true);
  });
});
