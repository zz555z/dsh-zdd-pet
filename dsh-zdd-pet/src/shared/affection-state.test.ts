/** 心情精度、长期亲密度与旧数据迁移的行为测试。 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decayAffection, restoreAffection, touchAffection } from './affection-state.ts';
import { loadAffection } from './affection-storage.ts';
import { displayMood } from './mood.ts';

test('每分钟结算一小时只降低心情四点，亲密度不变', () => {
  let state = restoreAffection({ stored: null, legacy: { v: 80, t: 0 }, initial: 60, now: 0 });
  for (let minute = 1; minute <= 60; minute++) state = decayAffection(state, minute * 60000, 4);
  assert.ok(Math.abs(state.mood - 76) < 1e-9);
  assert.equal(displayMood(state.mood), 76);
  assert.equal(state.intimacy, 80);
  const touched = touchAffection(state, 4);
  assert.equal(touched.intimacy, 84);
  assert.equal(touchAffection(touched, -30).intimacy, 84);
});

test('迁移保存版本化数据，重载不再以旧心情覆盖亲密度', () => {
  const entries = new Map([['dsh-zdd-pet-mood-main', JSON.stringify({ v: 80, t: 0 })]]);
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
  const first = loadAffection(storage, 'main', 60, 1000);
  assert.equal(first.stateVersion, 1);
  assert.equal(first.intimacy, 80);
  entries.set('dsh-zdd-pet-mood-main', JSON.stringify({ v: 10, t: 0 }));
  assert.deepEqual(loadAffection(storage, 'main', 60, 1000), first);
  assert.equal(loadAffection(storage, 'other', 60, 1000).intimacy, 60);
});

test('损坏数据与不可用存储可恢复，时钟回拨不重复衰减', () => {
  const state = loadAffection(
    {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('denied');
      },
    },
    'main',
    60,
    1000,
  );
  assert.equal(state.mood, 60);
  assert.deepEqual(decayAffection(state, 500, 4), state);
});
