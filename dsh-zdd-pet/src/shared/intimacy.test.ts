/**
 * 亲密度阶段纯逻辑的契约测试。
 *
 * 契约：数值→阶段边界正确；阶段属性缺省回退默认；台词池空时回退兜底；
 * 升级判定只在阶段序号变大时为真；校验/解析对坏数据宽容。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_INTIMACY,
  INTIMACY_THRESHOLDS,
  intimacyRank,
  intimacyStageOf,
  intimacyTextPool,
  intimacyTierOf,
  intimacyValid,
  isPromotion,
  readIntimacyParams,
} from './intimacy.ts';

describe('intimacyTierOf —— 数值判阶段', () => {
  test('边界值落在正确的阶段', () => {
    assert.equal(intimacyTierOf(0), 'stranger');
    assert.equal(intimacyTierOf(24), 'stranger');
    assert.equal(intimacyTierOf(INTIMACY_THRESHOLDS.familiar), 'familiar');
    assert.equal(intimacyTierOf(49), 'familiar');
    assert.equal(intimacyTierOf(INTIMACY_THRESHOLDS.close), 'close');
    assert.equal(intimacyTierOf(74), 'close');
    assert.equal(intimacyTierOf(INTIMACY_THRESHOLDS.bonded), 'bonded');
    assert.equal(intimacyTierOf(100), 'bonded');
  });

  test('NaN / 负数按最低阶段处理', () => {
    assert.equal(intimacyTierOf(NaN), 'stranger');
    assert.equal(intimacyTierOf(-5), 'stranger');
  });
});

describe('intimacyRank / isPromotion —— 升级判定', () => {
  test('序号随亲密递增', () => {
    assert.ok(intimacyRank('stranger') < intimacyRank('familiar'));
    assert.ok(intimacyRank('familiar') < intimacyRank('close'));
    assert.ok(intimacyRank('close') < intimacyRank('bonded'));
  });

  test('只有序号变大才算升级（降级/同级为 false）', () => {
    assert.equal(isPromotion('familiar', 'close'), true);
    assert.equal(isPromotion('close', 'close'), false);
    assert.equal(isPromotion('bonded', 'close'), false);
  });
});

describe('intimacyStageOf / intimacyTextPool —— 属性与台词', () => {
  test('缺省阶段回退到内置默认', () => {
    const p = readIntimacyParams({});
    const stage = intimacyStageOf(p, 'close');
    assert.equal(stage.label, '亲近');
    assert.ok(stage.texts.length > 0);
  });

  test('自定义台词优先、空则回退兜底池', () => {
    const p = readIntimacyParams({
      stages: { bonded: { label: '超级默契', texts: ['自定义一句'] } },
    });
    const stage = intimacyStageOf(p, 'bonded');
    assert.equal(stage.label, '超级默契');
    assert.deepEqual(stage.texts, ['自定义一句']);
    assert.deepEqual(intimacyTextPool(p, 'bonded', ['兜底']), ['自定义一句']);
    // 无自定义的空阶段 → 用兜底
    const p2 = readIntimacyParams({ stages: { stranger: { texts: [] } } });
    assert.deepEqual(intimacyTextPool(p2, 'stranger', ['兜底']), ['兜底']);
  });

  test('关闭后一律回退兜底', () => {
    const p = { ...DEFAULT_INTIMACY, enabled: false };
    assert.deepEqual(intimacyTextPool(p, 'bonded', ['兜底']), ['兜底']);
  });
});

describe('intimacyValid / readIntimacyParams —— 宽容解析', () => {
  test('enabled 必须是布尔', () => {
    assert.equal(intimacyValid({ enabled: true }), true);
    assert.equal(intimacyValid({ enabled: 'yes' }), false);
    assert.equal(intimacyValid({}), false);
    assert.equal(intimacyValid(null), false);
  });

  test('stages 子字段可缺省（部分合法）', () => {
    assert.equal(intimacyValid({ enabled: true, stages: { close: { label: 'x' } } }), true);
    assert.equal(intimacyValid({ enabled: true, stages: [] as unknown }), false);
  });

  test('坏数据解析成默认值而不抛', () => {
    const p = readIntimacyParams(undefined);
    assert.equal(p.enabled, true);
    assert.equal(p.stages.close.label, DEFAULT_INTIMACY.stages.close.label);
  });
});
