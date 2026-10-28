/**
 * 余额告急演出单测 —— 核心是**防刷屏**（用户选的是"只弹一次"）：
 *   ① 阈值：没跨过绝不弹；
 *   ② 冷却：触发后 cooldownMs 内不重复；
 *   ③ 已在告急区（armed）不重复弹——这是"只弹一次"的关键，而不是靠冷却碰运气；
 *   ④ 回落到阈值以下 → 解锁，下次再耗尽还能提醒。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseBalanceGag,
  newBalanceGagState,
  shouldFireBalanceGag,
  pickBalanceGag,
  BALANCE_GAG_DEFAULT_THRESHOLD,
} from './balance-gag.ts';

const cfg = parseBalanceGag({ enabled: true })!;
const HOUR = 60 * 60 * 1000;

describe('parseBalanceGag', () => {
  test('默认关闭', () => {
    assert.equal(parseBalanceGag(undefined), undefined);
    assert.equal(parseBalanceGag({}), undefined);
    assert.equal(parseBalanceGag({ enabled: false }), undefined);
  });

  test('合法值 + 默认阈值', () => {
    assert.equal(cfg.enabled, true);
    assert.equal(cfg.thresholdPercent, BALANCE_GAG_DEFAULT_THRESHOLD);
    assert.equal(cfg.cooldownMs, HOUR);
    assert.ok(cfg.texts.length > 0);
  });

  test('阈值/冷却非法 → 回落默认', () => {
    for (const bad of [0, -1, 101, NaN]) {
      assert.equal(
        parseBalanceGag({ enabled: true, thresholdPercent: bad })?.thresholdPercent,
        BALANCE_GAG_DEFAULT_THRESHOLD,
      );
    }
  });
});

describe('shouldFireBalanceGag —— 防刷屏', () => {
  test('第一次跨过阈值 → 弹一次', () => {
    const st = newBalanceGagState();
    assert.equal(shouldFireBalanceGag(cfg, st, 95, 1000), true);
  });

  test('没跨过阈值 → 永不弹', () => {
    const st = newBalanceGagState();
    assert.equal(shouldFireBalanceGag(cfg, st, 50, 1000), false);
    assert.equal(shouldFireBalanceGag(cfg, st, 89, 1000), false, '89 < 90 不弹');
  });

  test('★ 只弹一次：持续告急 + 超过冷却时间，也不再弹', () => {
    const st = newBalanceGagState();
    assert.equal(shouldFireBalanceGag(cfg, st, 95, 1000), true, '首次弹');
    // 过了两小时，仍然 95% —— 还是不该弹（armed 挡住，这才是"只弹一次"）
    assert.equal(shouldFireBalanceGag(cfg, st, 96, 1000 + 2 * HOUR), false);
    assert.equal(shouldFireBalanceGag(cfg, st, 99, 1000 + 5 * HOUR), false);
  });

  test('冷却内也不弹（即使没用 armed 场景）', () => {
    const st = newBalanceGagState();
    shouldFireBalanceGag(cfg, st, 95, 1000);
    st.armed = false; // 人为解除，只测冷却
    assert.equal(shouldFireBalanceGag(cfg, st, 95, 1000 + 1000), false, '冷却内不弹');
  });

  test('回落到阈值以下 → 解锁；再次耗尽能再提醒', () => {
    const st = newBalanceGagState();
    assert.equal(shouldFireBalanceGag(cfg, st, 95, 1000), true, '首次');
    assert.equal(shouldFireBalanceGag(cfg, st, 40, 2000), false, '回落：不弹');
    assert.equal(st.armed, false, '回落应解锁');
    assert.equal(shouldFireBalanceGag(cfg, st, 95, 3000), true, '再次耗尽 → 能再提醒（额度重置场景）');
  });

  test('percent 缺失/非法 → 不弹', () => {
    const st = newBalanceGagState();
    assert.equal(shouldFireBalanceGag(cfg, st, undefined, 1000), false);
    assert.equal(shouldFireBalanceGag(cfg, st, NaN, 1000), false);
  });
});

describe('pickBalanceGag', () => {
  test('抽文案 + 图，随机可注入', () => {
    const c = parseBalanceGag({ enabled: true, texts: ['A', 'B'], images: ['x', 'y'] })!;
    assert.deepEqual(
      pickBalanceGag(c, () => 0),
      { text: 'A', image: 'x' },
    );
    assert.deepEqual(
      pickBalanceGag(c, () => 0.99),
      { text: 'B', image: 'y' },
    );
  });

  test('没配图 → 纯文字', () => {
    const c = { ...cfg, images: [] };
    assert.equal(pickBalanceGag(c, () => 0).image, undefined);
  });
});
