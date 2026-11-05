/** 气泡调度行为：优先级、候选恢复、身份清理与卸载。 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createSayScheduler, type SayPayload } from './say-scheduler.ts';
import { PollStateStore } from './state.ts';

describe('say scheduler', () => {
  test('倒计时刷新不覆盖确认和完成；清确认后恢复最新倒计时', () => {
    const state = new PollStateStore();
    const say = () => state.read().pets.main.say.data as SayPayload;
    state.publishSay('main', { text: '50:00', hold: true }, { source: 'pomodoro-countdown' });
    state.publishSay('main', { text: '请确认', hold: true }, { source: 'confirm' });
    const counter = state.read().counter;
    state.publishSay('main', { text: '49:55', hold: true }, { source: 'pomodoro-countdown' });
    assert.equal(state.read().counter, counter);
    state.publishSay('main', { text: '完成', hold: true }, { source: 'complete' });
    assert.equal(say().text, '请确认');
    state.clearSay('main', { source: 'confirm' });
    assert.equal(say().text, '完成');
    state.clearSay('main', { source: 'complete' });
    assert.equal(say().text, '49:55');
    state.cancelAll();
  });

  test('clear按来源，迟到完成dismiss不得删除新的确认', () => {
    const state = new PollStateStore();
    const complete = state.publishSay('main', { text: '完成', hold: true }, { source: 'complete' })!;
    state.publishSay('main', { text: '请确认', hold: true }, { source: 'confirm' });
    state.clearSay('main', { messageId: complete.messageId });
    state.clearSay('main');
    assert.equal((state.read().pets.main.say.data as SayPayload).text, '请确认');
    assert.equal(state.clearSay('main', { source: 'confirm', expectedCounter: complete.counter }), false);
    state.cancelAll();
  });

  test('相同文字的两次完成拥有独立身份，旧清理不清新消息', () => {
    const state = new PollStateStore();
    const first = state.publishSay('main', { text: '搞定', hold: true }, { source: 'complete' })!;
    const second = state.publishSay('main', { text: '搞定', hold: true }, { source: 'complete' })!;
    assert.notEqual(first.messageId, second.messageId);
    assert.equal(state.clearSay('main', { source: 'complete', messageId: first.messageId }), false);
    assert.equal((state.read().pets.main.say.data as SayPayload).messageId, second.messageId);
    state.cancelAll();
  });

  test('到期剔除隐藏候选，恢复倒计时；卸载不再投递', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
    const seen: SayPayload[] = [];
    const scheduler = createSayScheduler((_petId, payload) => seen.push(payload));
    scheduler.publish('main', { text: '倒计时', hold: true }, { source: 'pomodoro-countdown' });
    scheduler.publish('main', { text: '完成', hold: true }, { source: 'complete', expiresAt: 2000 });
    scheduler.publish('main', { text: '短消息' }, { source: 'chat', expiresAt: 1500 });
    t.mock.timers.tick(1000);
    assert.equal(seen[seen.length - 1]?.text, '倒计时');
    scheduler.publish('main', { text: '再一条' }, { source: 'chat', expiresAt: 3000 });
    scheduler.stop();
    const count = seen.length;
    t.mock.timers.tick(10000);
    assert.equal(seen.length, count);
    assert.equal(scheduler.publish('main', { text: '卸载后' }, { source: 'chat' }), undefined);
  });
});
