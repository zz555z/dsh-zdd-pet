/**
 * 随机小事件纯逻辑的契约测试。
 *
 * 契约：抽签避开当前动画、池空返回 undefined、单元素池直接返回；
 * 间隔落在 [min,max] 内且单位毫秒；解析对坏数据宽容、min>max 自动交换；校验范围正确。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_IDLE_EVENTS,
  IDLE_GAP_MAX_SEC,
  IDLE_GAP_MIN_SEC,
  idleEventsValid,
  pickIdleEvent,
  randomIdleGapMs,
  readIdleEventsParams,
} from './idle-events.ts';

describe('pickIdleEvent —— 抽签', () => {
  test('空池返回 undefined', () => {
    assert.equal(pickIdleEvent([]), undefined);
  });

  test('单元素池直接返回该元素', () => {
    const e = { anim: 'A', text: 'x' };
    assert.deepEqual(pickIdleEvent([e]), e);
  });

  test('多元素池尽量避开当前动画', () => {
    const pool = [{ anim: 'A' }, { anim: 'B' }];
    for (let i = 0; i < 20; i += 1) {
      assert.equal(pickIdleEvent(pool, 'A')?.anim, 'B');
    }
  });

  test('非法条目被过滤', () => {
    const pool = [{ anim: '' } as unknown as { anim: string }, { anim: 'B' }];
    assert.equal(pickIdleEvent(pool)?.anim, 'B');
  });
});

describe('randomIdleGapMs —— 间隔', () => {
  test('落在 [min,max] 秒对应的毫秒区间', () => {
    const params = { ...DEFAULT_IDLE_EVENTS, minGapSec: 30, maxGapSec: 60 };
    for (let i = 0; i < 50; i += 1) {
      const ms = randomIdleGapMs(params);
      assert.ok(ms >= 30_000 && ms <= 60_000, `ms=${ms}`);
    }
  });

  test('min 大于 max 时仍产出合法区间（不抛）', () => {
    const params = { ...DEFAULT_IDLE_EVENTS, minGapSec: 60, maxGapSec: 30 };
    const ms = randomIdleGapMs(params);
    assert.ok(Number.isFinite(ms) && ms > 0);
  });
});

describe('idleEventsValid / readIdleEventsParams —— 宽容解析', () => {
  test('enabled 必须是布尔', () => {
    assert.equal(idleEventsValid({ enabled: true }), true);
    assert.equal(idleEventsValid({ enabled: 1 }), false);
    assert.equal(idleEventsValid(null), false);
  });

  test('间隔超范围非法', () => {
    assert.equal(idleEventsValid({ enabled: true, minGapSec: IDLE_GAP_MIN_SEC - 1 }), false);
    assert.equal(idleEventsValid({ enabled: true, maxGapSec: IDLE_GAP_MAX_SEC + 1 }), false);
    assert.equal(idleEventsValid({ enabled: true, minGapSec: IDLE_GAP_MIN_SEC }), true);
  });

  test('events 必须是数组', () => {
    assert.equal(idleEventsValid({ enabled: true, events: {} as unknown }), false);
  });

  test('解析坏数据回退默认，坏条目被过滤', () => {
    const p = readIdleEventsParams(undefined);
    assert.equal(p.enabled, true);
    assert.ok(p.events.length > 0);
    const p2 = readIdleEventsParams({ events: [{ anim: 'X', text: 'y' }, { text: 'no-anim' }] });
    assert.equal(p2.events.length, 1);
    assert.equal(p2.events[0]!.anim, 'X');
  });

  test('min/max 颠倒自动交换', () => {
    const p = readIdleEventsParams({ minGapSec: 300, maxGapSec: 100 });
    assert.ok(p.minGapSec <= p.maxGapSec);
  });
});
