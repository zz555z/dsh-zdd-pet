/**
 * 随机小事件（桌面端）：空闲时每隔一段随机时间自己做个动作，偶尔配一句气泡。
 *
 * 纯逻辑（事件池/抽签/间隔）在 shared-core（S.readIdleEventsParams / S.pickIdleEvent / S.randomIdleGapMs），
 * 本文件只负责「何时抽、怎么播」。必须在其后加载：sprite.js（PetSprite 定义）。
 * 定时器由 events.js 的 startLoops 统一驱动（每 5s 检查一次是否到点）。
 * @module dsh-zdd-pet/runtime/electron-helper/sprite-idle-events
 */
'use strict';

Object.assign(PetSprite.prototype, {
  /** 当前随机小事件参数（含默认值兜底）。 */
  idleEventsParams() {
    return S.readIdleEventsParams(this.pet.idleEvents);
  },

  /**
   * 初始化随机小事件的下次触发时刻（启动时调一次；之后每次触发重排）。
   * 关闭时不排。
   */
  initIdleEvents() {
    const p = this.idleEventsParams();
    this._idleNextAt = p.enabled ? Date.now() + S.randomIdleGapMs(p) : 0;
  },

  /**
   * 随机小事件检查（由 startLoops 定时调用）：
   * 到点且「真闲着」（没拖拽 / 没冻结 / 没睡 / 工作状态非进行中）→ 播一个事件动作（偶尔配气泡），
   * 然后按配置重排下一次；不满足条件就顺延 30s 再查，不浪费这次抽取。
   */
  checkIdleEvent() {
    const p = this.idleEventsParams();
    if (!p.enabled) {
      this._idleNextAt = 0;
      return;
    }
    const now = Date.now();
    if (!this._idleNextAt) this._idleNextAt = now + S.randomIdleGapMs(p);
    if (now < this._idleNextAt) return;
    // 忙碌判定：拖拽 / 冻结 / 打瞌睡 / 工作状态非终态 —— 任一成立就顺延，不打扰。
    const busy =
      (this.dragState && this.dragState.active) ||
      this.frozen === true ||
      this.sleeping === true ||
      (this.workState && this.workState !== 'success' && this.workState !== 'error');
    if (busy) {
      this._idleNextAt = now + 30000;
      return;
    }
    const ev = S.pickIdleEvent(p.events, this.anim);
    // 重排下一次（无论这次是否播成功，都别卡在同一时刻）。
    this._idleNextAt = now + S.randomIdleGapMs(p);
    if (!ev || !this._hasAnim(ev.anim)) return;
    // 小事件本身就是活动：刷新作息计时，避免和打瞌睡撞车。
    this.rememberActivity();
    this.stopMove();
    this.playOnce(ev.anim);
    if (ev.text) this.showWhisper(ev.text, undefined, undefined, undefined, false);
    console.log(
      '[dsh-zdd-pet] ' +
        new Date().toTimeString().slice(0, 8) +
        ' 随机小事件 pet=' +
        this.pet.id +
        ' -> [' +
        ev.anim +
        ']',
    );
  },
});
