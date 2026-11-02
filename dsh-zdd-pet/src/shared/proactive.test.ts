/**
 * 主动关心 + 长期记忆纯逻辑的契约测试。
 *
 * 契约：时段跨午夜判定；decideCare 的优先级（专注>深夜>久未）、冷却期一律不触发；
 * 事实合并去重与上限；解析与校验宽容。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_PROACTIVE,
  MEMORY_FACT_MAX,
  decideCare,
  isLateNight,
  proactiveValid,
  readProactiveParams,
} from './proactive.ts';
import { mergeFacts, parseFacts } from '../host/plugin/memory-facts.ts';

describe('isLateNight —— 深夜时段（含跨午夜）', () => {
  test('跨午夜区间 23→5', () => {
    assert.equal(isLateNight(23, 23, 5), true);
    assert.equal(isLateNight(2, 23, 5), true);
    assert.equal(isLateNight(4, 23, 5), true);
    assert.equal(isLateNight(5, 23, 5), false);
    assert.equal(isLateNight(12, 23, 5), false);
  });

  test('同一天内区间 1→4', () => {
    assert.equal(isLateNight(1, 1, 4), true);
    assert.equal(isLateNight(3, 1, 4), true);
    assert.equal(isLateNight(4, 1, 4), false);
  });
});

describe('decideCare —— 触发判据与优先级', () => {
  const base = { params: { ...DEFAULT_PROACTIVE }, now: 1_000_000_000, lastCareAt: 0 };

  test('冷却期内一律不触发', () => {
    const r = decideCare({
      ...base,
      lastInteractionAt: 0,
      lastCareAt: base.now - 1000, // 刚刚关心过
      hour: 2,
      recentlyActive: true,
      justFinishedFocus: true,
    });
    assert.equal(r, null);
  });

  test('优先级：刚结束专注 > 深夜在忙 > 久未搭理', () => {
    // 三者都满足 → 专注优先
    assert.equal(
      decideCare({
        ...base,
        lastInteractionAt: base.now - 100 * 3600_000, // 很久没交互
        hour: 2,
        recentlyActive: true,
        justFinishedFocus: true,
      }),
      'after-focus',
    );
    // 无专注信号，深夜+在忙 → late-night
    assert.equal(
      decideCare({
        ...base,
        lastInteractionAt: base.now - 100 * 3600_000,
        hour: 2,
        recentlyActive: true,
        justFinishedFocus: false,
      }),
      'late-night',
    );
    // 无专注、非深夜 → idle
    assert.equal(
      decideCare({
        ...base,
        lastInteractionAt: base.now - 100 * 3600_000,
        hour: 12,
        recentlyActive: false,
        justFinishedFocus: false,
      }),
      'idle',
    );
  });

  test('都不满足 → null', () => {
    assert.equal(
      decideCare({
        ...base,
        lastInteractionAt: base.now - 1000, // 刚交互过
        hour: 12,
        recentlyActive: false,
        justFinishedFocus: false,
      }),
      null,
    );
  });

  test('关闭 → null', () => {
    assert.equal(
      decideCare({
        ...base,
        params: { ...DEFAULT_PROACTIVE, enabled: false },
        lastInteractionAt: 0,
        hour: 2,
        recentlyActive: true,
        justFinishedFocus: true,
      }),
      null,
    );
  });
});

describe('proactiveValid / readProactiveParams', () => {
  test('enabled 必须布尔、数值范围校验', () => {
    assert.equal(proactiveValid({ enabled: true }), true);
    assert.equal(proactiveValid({ enabled: 'x' }), false);
    assert.equal(proactiveValid({ enabled: true, idleHours: 0 }), false);
    assert.equal(proactiveValid({ enabled: true, lateNightFrom: 24 }), false);
    assert.equal(proactiveValid({ enabled: true, lateNightFrom: 5.5 }), false);
    assert.equal(proactiveValid({ enabled: true, lateNightFrom: 23, lateNightTo: 5 }), true);
  });

  test('坏数据解析成默认', () => {
    const p = readProactiveParams(null);
    assert.equal(p.enabled, true);
    assert.equal(p.longMemory, true);
  });
});

describe('parseFacts / mergeFacts —— 长期记忆', () => {
  test('解析：去编号、识别「无」、过滤超长', () => {
    assert.deepEqual(parseFacts('无'), []);
    assert.deepEqual(parseFacts('- 用户是程序员\n2. 在做桌宠项目'), ['用户是程序员', '在做桌宠项目']);
  });

  test('合并去重与上限', () => {
    const old = [{ text: '用户是程序员', ts: 1 }];
    const merged = mergeFacts(old, ['用户是程序员', '喜欢蓝色'], 2);
    assert.equal(merged.facts.length, 2); // 重复的跳过
    assert.equal(merged.added, 1);
    assert.equal(merged.facts[1]!.text, '喜欢蓝色');
    // 上限淘汰最旧（新增计数不受淘汰影响）
    const many = Array.from({ length: MEMORY_FACT_MAX + 5 }, (_, i) => ({ text: 'f' + i, ts: i }));
    const capped = mergeFacts(many, ['new'], 999);
    assert.equal(capped.facts.length, MEMORY_FACT_MAX);
    assert.equal(capped.added, 1);
    assert.equal(capped.facts[capped.facts.length - 1]!.text, 'new');
  });
});
