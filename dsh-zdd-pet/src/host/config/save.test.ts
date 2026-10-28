/**
 * saveUserConfig 的番茄钟语义单测：钉住「设置页只写 enabled/intervalMin，其余子键（texts）透传保留」。
 *
 * 这是本次新增功能的关键契约：pomodoro 是对象，设置页不编辑文案池，
 * 落盘时必须与 existing 的 pomodoro 段浅合并，否则每次保存都会把用户手改的 texts 抹掉。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { saveUserConfig } from './save.ts';

/** 一份最小合法 pets（saveUserConfig 要求）。 */
const pets = [
  {
    id: 'main',
    name: '大肥鱼',
    size: 300,
    balanceEnabled: false,
    display: 'desktop',
    position: { corner: 'bottom-right', marginX: 20, marginY: 10 },
  },
];

describe('saveUserConfig —— pomodoro 落盘', () => {
  test('传了 pomodoro：enabled/intervalMin 进白名单，intervalMin 归一成数字', () => {
    const clean = saveUserConfig({ pets, pomodoro: { enabled: true, intervalMin: '25' } });
    assert.deepEqual(clean?.pomodoro, { enabled: true, intervalMin: 25 });
  });

  test('existing 里手改的 texts 被透传合并（不被设置页保存抹掉）', () => {
    const existing = { pomodoro: { enabled: false, intervalMin: 50, texts: ['自定义提醒'] } };
    const clean = saveUserConfig({ pets, pomodoro: { enabled: true, intervalMin: 30 } }, existing);
    assert.deepEqual(clean?.pomodoro, { enabled: true, intervalMin: 30, texts: ['自定义提醒'] });
  });

  test('非法 pomodoro（间隔越界）→ 整包拒绝（返回 null）', () => {
    assert.equal(saveUserConfig({ pets, pomodoro: { enabled: true, intervalMin: 0 } }), null);
  });

  test('未传 pomodoro：从 existing 透传保留（设置页漏传不抹掉用户配置）', () => {
    const existing = { pomodoro: { enabled: true, intervalMin: 45, texts: ['x'] } };
    const clean = saveUserConfig({ pets }, existing);
    assert.deepEqual(clean?.pomodoro, { enabled: true, intervalMin: 45, texts: ['x'] });
  });
});
