/**
 * 气泡单槽的纯函数契约（src/client/pet/card/bubble-slots.ts）：优先级判定与余额页数。
 *
 * 只覆盖无状态部分；显隐与停留计时需要真实渲染，由手动验收。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import type { BalanceState } from '../../../shared/balance/index.ts';
import { balancePageCount, decideBubbleSlot, type BubbleSlotInput } from './bubble-slots.ts';

/** 一份全部关闭的输入，逐项覆盖出目标场景。 */
function input(overrides: Partial<BubbleSlotInput> = {}): BubbleSlotInput {
  return {
    workTerminal: false,
    workOn: false,
    workText: null,
    workHasTask: false,
    workStatusEnabled: true,
    whisperOn: false,
    whisperText: null,
    whisperHold: false,
    balanceOn: false,
    balanceAvailable: true,
    balanceEnabled: true,
    balanceManual: false,
    ...overrides,
  };
}

const windowsState: BalanceState = { provider: 'test', shape: 'windows', ok: true };
const customState = (pages: number): BalanceState => ({
  provider: 'test',
  shape: 'custom',
  ok: true,
  custom: { views: Array.from({ length: pages }, () => ({ tag: 'div', text: '页' })) },
});
const failedState: BalanceState = { provider: 'test', ok: false, reason: 'fetch-error' };

describe('decideBubbleSlot —— 同一时刻只挂一个气泡', () => {
  test('都没有点亮：返回 none', () => {
    assert.equal(decideBubbleSlot(input()), 'none');
  });

  test('等待用户确认的常驻气泡优先级最高：终态任务/进度/余额都不能顶掉', () => {
    assert.equal(
      decideBubbleSlot(
        input({
          whisperOn: true,
          whisperText: '有个操作需要你确认',
          whisperHold: true,
          workTerminal: true,
          workOn: true,
          workText: '完成',
          workHasTask: true,
          balanceOn: true,
          balanceAvailable: true,
        }),
      ),
      'whisper',
    );
    // 非 hold 的说话气泡仍是原优先级（终态任务更高）。
    assert.equal(
      decideBubbleSlot(
        input({
          whisperOn: true,
          whisperText: '普通',
          whisperHold: false,
          workTerminal: true,
          workOn: true,
          workText: '完成',
        }),
      ),
      'work-terminal',
    );
  });

  test('终态任务压过说话与余额：只活 10s，不让位', () => {
    const slot = decideBubbleSlot(
      input({
        workTerminal: true,
        workOn: true,
        workText: '跑完了',
        whisperOn: true,
        whisperText: '在',
        balanceOn: true,
      }),
    );
    assert.equal(slot, 'work-terminal');
  });

  test('说话压过余额与非终态任务：优先级第二', () => {
    const slot = decideBubbleSlot(
      input({ whisperOn: true, whisperText: '在', balanceOn: true, workOn: true, workText: '干活中' }),
    );
    assert.equal(slot, 'whisper');
  });

  test('有任务（含清单进度）时进度气泡优先：碎碎念与余额一并让位', () => {
    // 用户要看的是「2/5」，不能被碎碎念/余额顶掉；终态仍单独最高优先。
    assert.equal(
      decideBubbleSlot(
        input({ workOn: true, workText: '干活中', workHasTask: true, whisperOn: true, whisperText: '在' }),
      ),
      'work',
    );
    assert.equal(
      decideBubbleSlot(input({ workOn: true, workText: '干活中', workHasTask: true, balanceOn: true })),
      'work',
    );
  });

  test('有任务但未点亮工作气泡：不占槽位（让位给说话/余额）', () => {
    assert.equal(
      decideBubbleSlot(input({ workOn: false, workHasTask: true, whisperOn: true, whisperText: '在' })),
      'whisper',
    );
  });

  test('终态在有任务时仍最高优先（完成气泡不因进度被压掉）', () => {
    assert.equal(
      decideBubbleSlot(input({ workTerminal: true, workOn: true, workText: '完成', workHasTask: true })),
      'work-terminal',
    );
  });

  test('余额压过非终态任务：常驻任务让位 10s 没有损失', () => {
    const slot = decideBubbleSlot(input({ balanceOn: true, workOn: true, workText: '干活中' }));
    assert.equal(slot, 'balance');
  });

  test('只剩非终态任务：常驻显示', () => {
    assert.equal(decideBubbleSlot(input({ workOn: true, workText: '干活中' })), 'work');
  });

  test('关闭工作状态联动：任务气泡不占槽位', () => {
    assert.equal(decideBubbleSlot(input({ workOn: true, workText: '干活中', workStatusEnabled: false })), 'none');
  });

  test('余额数据未拉到：不挂余额气泡', () => {
    assert.equal(decideBubbleSlot(input({ balanceOn: true, balanceAvailable: false })), 'none');
  });

  test('关闭余额且非手动请求：不挂余额气泡；手动请求照常挂', () => {
    assert.equal(decideBubbleSlot(input({ balanceOn: true, balanceEnabled: false })), 'none');
    assert.equal(decideBubbleSlot(input({ balanceOn: true, balanceEnabled: false, balanceManual: true })), 'balance');
  });
});

describe('balancePageCount —— 余额气泡可翻页数', () => {
  test('没有数据或拉取失败：一页', () => {
    assert.equal(balancePageCount(null), 1);
    assert.equal(balancePageCount(failedState), 1);
  });

  test('windows：收起与展开两页', () => {
    assert.equal(balancePageCount(windowsState), 2);
  });

  test('custom：页数取第三方视图数', () => {
    assert.equal(balancePageCount(customState(3)), 3);
  });

  test('custom 只有一页：仍按一页算，不出现空翻页', () => {
    assert.equal(balancePageCount(customState(1)), 1);
  });

  test('内置单页形态：一页', () => {
    assert.equal(balancePageCount({ provider: 'test', shape: 'money', ok: true }), 1);
  });
});
