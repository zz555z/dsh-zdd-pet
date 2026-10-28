/**
 * 任务彩蛋纯逻辑单测 —— 钉住三件事：
 *   ① 配置解析：形状非法 / 空档位 → 不投（undefined），绝不抛；
 *   ② 图名过滤：配置里写错的图名被跳过，不会变成破图；全错 → 退回纯文字；
 *   ③ 随机可注入：同一配置多次取结果稳定可断言，文案按码点截断。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { parseEasterEggs, pickEasterEgg, EASTER_TEXT_MAX } from './easter-egg.ts';

describe('parseEasterEggs —— 配置解析', () => {
  test('合法两档 → 结构化', () => {
    const cfg = parseEasterEggs({
      success: { texts: ['收工'], images: ['可爱'] },
      error: { texts: ['卡住了'] },
    });
    assert.deepEqual(cfg, {
      success: { texts: ['收工'], images: ['可爱'] },
      error: { texts: ['卡住了'], images: [] },
    });
  });

  test('缺失 / 非对象 / 空档位 → undefined（不投）', () => {
    assert.equal(parseEasterEggs(undefined), undefined);
    assert.equal(parseEasterEggs(null), undefined);
    assert.equal(parseEasterEggs('x'), undefined);
    assert.equal(parseEasterEggs({}), undefined);
    assert.equal(parseEasterEggs({ success: { texts: [], images: [] } }), undefined, '空档位等同未配置');
    assert.equal(parseEasterEggs({ success: { texts: ['  '] } }), undefined, '纯空白文案被过滤');
  });

  test('非字符串元素被剔除，不污染数组', () => {
    const cfg = parseEasterEggs({ success: { texts: ['ok', 123, null, 'bf'], images: ['可爱', 42] } });
    assert.deepEqual(cfg?.success, { texts: ['ok', 'bf'], images: ['可爱'] });
  });
});

describe('pickEasterEgg —— 取一条彩蛋', () => {
  const alwaysFirst = () => 0;

  test('success 档：抽第一张图 + 第一句', () => {
    const cfg = parseEasterEggs({ success: { texts: ['收工啦', '辛苦'], images: ['可爱', '吃饱饱摸肚子'] } });
    const cue = pickEasterEgg(cfg, 'success', null, alwaysFirst);
    assert.deepEqual(cue, { text: '收工啦', image: '可爱' });
  });

  test('没配 images → 纯文字气泡', () => {
    const cfg = parseEasterEggs({ error: { texts: ['又卡住了'] } });
    assert.deepEqual(pickEasterEgg(cfg, 'error', null, alwaysFirst), { text: '又卡住了' });
  });

  test('图名不在池里 → 过滤掉；全错 → 退回纯文字', () => {
    const cfg = parseEasterEggs({ success: { texts: ['好'], images: ['不存在的图'] } });
    const pool = new Set(['可爱', '死掉了']);
    assert.deepEqual(pickEasterEgg(cfg, 'success', pool, alwaysFirst), { text: '好' });
  });

  test('有池时只留命中项', () => {
    const cfg = parseEasterEggs({ success: { texts: ['好'], images: ['不存在的图', '死掉了'] } });
    const pool = new Set(['死掉了']);
    assert.deepEqual(pickEasterEgg(cfg, 'success', pool, alwaysFirst), { text: '好', image: '死掉了' });
  });

  test('只配图没配文案 → 用占位文字撑起气泡', () => {
    const cfg = parseEasterEggs({ success: { images: ['可爱'] } });
    const cue = pickEasterEgg(cfg, 'success', null, alwaysFirst);
    assert.equal(cue?.image, '可爱');
    assert.ok(cue?.text && cue.text.length > 0, '必须有文字，否则气泡撑不起来');
  });

  test('该档位未配置 → undefined', () => {
    const cfg = parseEasterEggs({ success: { texts: ['好'] } });
    assert.equal(pickEasterEgg(cfg, 'error', null, alwaysFirst), undefined);
  });

  test('超长文案按码点截断加省略号', () => {
    const long = '甲'.repeat(EASTER_TEXT_MAX + 3);
    const cfg = parseEasterEggs({ success: { texts: [long] } });
    const cue = pickEasterEgg(cfg, 'success', null, alwaysFirst);
    assert.equal(Array.from(cue?.text ?? '').length, EASTER_TEXT_MAX + 1); // 24 字 + 省略号
    assert.equal(cue?.text.endsWith('…'), true);
  });

  test('随机注入：不同 rand 取到不同条目', () => {
    const cfg = parseEasterEggs({ success: { texts: ['A', 'B', 'C'] } });
    assert.equal(pickEasterEgg(cfg, 'success', null, () => 0)?.text, 'A');
    assert.equal(pickEasterEgg(cfg, 'success', null, () => 0.99)?.text, 'C');
  });
});

describe('默认配置必须真实包含 taskEasterEggs 键（否则用户层覆盖会被 mergeEntry 丢掉）', () => {
  // 这是实测踩到的 bug：默认配置里只写了注释块（不是真实 key），mergeEntry 只遍历 base 的 key，
  // 于是用户层写的 taskEasterEggs 被静默丢弃，功能「配置了但不生效」。
  test('assets/config.jsonc 里 taskEasterEggs 是真实键，值为空对象', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const path = fileURLToPath(new URL('../../assets/config.jsonc', import.meta.url));
    const raw = readFileSync(path, 'utf8');
    const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^\\:])\/\/.*$/gm, '$1');
    const cfg = JSON.parse(stripped) as Record<string, unknown>;
    assert.ok('taskEasterEggs' in cfg, '默认配置缺 taskEasterEggs 键 → 用户层覆盖会被丢');
    assert.equal(typeof cfg.taskEasterEggs, 'object', '默认值应是对象（空对象=默认关闭）');
  });
});
