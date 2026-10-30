/**
 * 节日自动演出纯逻辑单测：日期命中、文案/动画解析、日期键与覆盖项。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { dateKeyOf, festivalOf, maybeFestival, resolveFestival } from './festival.ts';
import { PollStateStore } from './state.ts';
import { DEFAULT_FESTIVAL, festivalValid, readFestivalParams } from '../shared/festival.ts';

describe('festivalOf —— 当天节日', () => {
  test('公历节日命中', () => {
    assert.equal(festivalOf(new Date(2026, 11, 25))?.entry.name, '圣诞节');
    assert.equal(festivalOf(new Date(2026, 9, 1))?.entry.name, '国庆节');
    assert.equal(festivalOf(new Date(2026, 1, 14))?.entry.name, '情人节');
    assert.equal(festivalOf(new Date(2026, 11, 31))?.entry.name, '跨年夜');
  });

  test('普通日子 / 非法日期 → undefined', () => {
    assert.equal(festivalOf(new Date(2026, 10, 15)), undefined); // 2026-11-15 无节日
    assert.equal(festivalOf(new Date(Number.NaN)), undefined);
  });
});

describe('resolveFestival —— 文案与动画', () => {
  test('默认：内置祝福语 + 内置动画', () => {
    const cue = resolveFestival(new Date(2026, 11, 25), DEFAULT_FESTIVAL);
    assert.equal(cue?.name, '圣诞节');
    assert.equal(cue?.anim, '装点圣诞树');
    assert.ok(cue?.text.includes('圣诞'));
  });

  test('配置覆盖：文案与动画按节日名覆盖', () => {
    const cue = resolveFestival(new Date(2026, 9, 1), {
      ...DEFAULT_FESTIVAL,
      texts: { 国庆节: '国庆自定义' },
      animations: { 国庆节: '写福字' },
    });
    assert.equal(cue?.text, '国庆自定义');
    assert.equal(cue?.anim, '写福字');
  });

  test('关闭 / 无节日 → undefined', () => {
    assert.equal(resolveFestival(new Date(2026, 11, 25), { ...DEFAULT_FESTIVAL, enabled: false }), undefined);
    assert.equal(resolveFestival(new Date(2026, 10, 15), DEFAULT_FESTIVAL), undefined);
  });
});

describe('dateKeyOf', () => {
  test('本地年月日', () => {
    assert.equal(dateKeyOf(new Date(2026, 0, 5)), '2026-1-5');
  });
});

describe('readFestivalParams / festivalValid', () => {
  test('缺省 → 默认；非法子项过滤', () => {
    const p = readFestivalParams(undefined);
    assert.equal(p.enabled, true);
    assert.equal(p.cooldownHours, 20);
    const q = readFestivalParams({ enabled: false, cooldownHours: 5, texts: { a: 'x', b: '' }, animations: { a: 1 } });
    assert.equal(q.enabled, false);
    assert.equal(q.cooldownHours, 5);
    assert.deepEqual(q.texts, { a: 'x' });
    assert.deepEqual(q.animations, {});
  });

  test('校验：布尔 + 冷却范围 + 表必须是对象', () => {
    assert.equal(festivalValid(DEFAULT_FESTIVAL), true);
    assert.equal(festivalValid({ enabled: true, cooldownHours: 0 }), false);
    assert.equal(festivalValid({ enabled: 'yes', cooldownHours: 5 }), false);
    assert.equal(festivalValid({ enabled: true, cooldownHours: 5, texts: [] }), false);
  });
});

const log = { info() {}, warn() {}, error() {}, debug() {} };

/** 最小默认配置：一个宠物 + 一段可被 animExists 命中的动画池。 */
function setup(festival: object) {
  const userRoot = mkdtempSync(join(tmpdir(), 'festival-'));
  const defFile = join(userRoot, 'default.jsonc');
  writeFileSync(
    defFile,
    JSON.stringify({
      festival,
      bubbleImageEnabled: false,
      pets: [
        {
          id: 'main',
          name: '鱼',
          size: 300,
          balanceEnabled: false,
          display: 'desktop',
          position: { corner: 'bottom-right', marginX: 24, marginY: 20 },
        },
      ],
      animations: {
        idle: ['待机'],
        turn: [],
        drag: [],
        clicks: [],
        moves: { default: {}, actions: [] },
        categories: [{ id: 'c', weight: 1, actions: ['装点圣诞树'] }],
        events: { balance: ['x'] },
      },
    }),
    'utf8',
  );
  return {
    userRoot,
    deps: {
      configPaths: { defaultFile: defFile, userFile: join(userRoot, 'main-config.jsonc') },
      state: new PollStateStore(),
      log,
      memeDirsFor: () => [],
      userRoot,
    } as unknown as Parameters<typeof maybeFestival>[0],
  };
}

describe('maybeFestival —— 投递与去重', () => {
  test('圣诞当天投一句祝福并播节日动画；同一天第二次启动不再演', () => {
    const { userRoot, deps } = setup({ enabled: true, cooldownHours: 20 });
    const day = new Date(2026, 11, 25);
    assert.equal(maybeFestival(deps, day), 1);
    const snap = deps.state.read() as {
      pets: Record<string, Record<string, { data?: { text?: string; name?: string } }>>;
    };
    assert.ok((snap.pets.main?.say?.data?.text ?? '').includes('圣诞'));
    assert.equal(snap.pets.main?.anim?.data?.name, '装点圣诞树');
    assert.ok(existsSync(join(userRoot, 'festival-state.json')));
    // 同一天再启动：去重，不再投递
    assert.equal(maybeFestival(deps, day), 0);
  });

  test('关闭 festival → 不投递', () => {
    const { deps } = setup({ enabled: false, cooldownHours: 20 });
    assert.equal(maybeFestival(deps, new Date(2026, 11, 25)), 0);
  });

  test('普通日子 → 不投递', () => {
    const { deps } = setup({ enabled: true, cooldownHours: 20 });
    assert.equal(maybeFestival(deps, new Date(2026, 10, 15)), 0);
  });
});
