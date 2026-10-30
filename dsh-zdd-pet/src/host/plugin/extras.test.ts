/**
 * 确认气泡投递：验证 hold / 时长 / 偏好表情包 / clear 的落点。
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createExtras } from './extras.ts';
import { CONFIRM_HOLD_MS } from '../confirm.ts';
import { PollStateStore } from '../state.ts';

function setup(workStatusEnabled: boolean, bubbleImageEnabled = true) {
  const root = mkdtempSync(join(tmpdir(), 'confirm-'));
  const memesDir = join(root, 'memes');
  mkdirSync(memesDir);
  const memeNames = ['压力一只大肥鱼', '哦鲸鲸', '可爱', '厉害了我的鲸'];
  for (const name of memeNames) writeFileSync(join(memesDir, name + '.png'), '');
  const memes = Object.fromEntries(memeNames.map((n) => [n, '描述']));
  const defFile = join(root, 'default.jsonc');
  writeFileSync(
    defFile,
    JSON.stringify({
      bubbleImageEnabled,
      memes,
      pets: [
        {
          id: 'main',
          name: '鱼',
          size: 300,
          balanceEnabled: false,
          whisperEnabled: false,
          workStatusEnabled,
          fixedEnabled: false,
          display: 'desktop',
          position: { corner: 'bottom-right', marginX: 24, marginY: 20 },
        },
      ],
    }),
    'utf8',
  );
  const state = new PollStateStore();
  const extras = createExtras({
    configPaths: { defaultFile: defFile, userFile: join(root, 'main-config.jsonc'), petDir: join(root, 'pet') },
    memeDirsFor: () => [memesDir],
    state,
  });
  const say = () => (state.read() as { pets: Record<string, { say?: { data?: unknown } }> }).pets.main?.say?.data;
  return { extras, say };
}

describe('deliverConfirm / clearConfirm', () => {
  test('投递常驻气泡：hold + 超长时长 + 偏好表情包；clear 写清空', () => {
    const { extras, say } = setup(true);
    assert.equal(
      extras.deliverConfirm('approval', '有个操作需要你确认', () => 0),
      1,
    );
    assert.deepEqual(say(), {
      text: '有个操作需要你确认',
      image: '压力一只大肥鱼',
      hold: true,
      duration: CONFIRM_HOLD_MS,
    });
    assert.equal(extras.clearConfirm(), 1);
    assert.deepEqual(say(), { clear: true });
  });

  test('未启用工作状态联动 → 不投', () => {
    const { extras, say } = setup(false);
    assert.equal(extras.deliverConfirm('question', '选哪个？'), 0);
    assert.equal(say(), undefined);
  });

  test('关闭气泡配图总开关 → 只投文字', () => {
    const { extras, say } = setup(true, false);
    assert.equal(extras.deliverConfirm('question', '选哪个？'), 1);
    assert.deepEqual(say(), { text: '选哪个？', hold: true, duration: CONFIRM_HOLD_MS });
  });
});
