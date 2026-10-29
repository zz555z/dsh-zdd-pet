/**
 * 心情 / 亲密度（桌面端）：localStorage 持久化 + 摸它涨 + 久不理随时间衰减。
 *
 * 纯算法在 shared-core（S.readMoodParams / clampMood / moodTier / decayMood / moodLabel），
 * 本文件只负责「存取 + 定时 + 接到气泡/菜单」。心情值随宠物实例（petId）单独存。
 * 必须在其后加载：sprite.js（PetSprite 定义）。
 * @module dsh-zdd-pet/runtime/electron-helper/sprite-mood
 */
'use strict';

/** localStorage 键：按宠物 id 分开存 { v: 心情, t: 上次保存时间戳 }。 */
const moodKeyOf = (petId) => 'dsh-zdd-pet-mood-' + petId;

Object.assign(PetSprite.prototype, {
  /** 当前心情配置（含默认值兜底）。 */
  moodParams() {
    return S.readMoodParams(this.pet.mood);
  },

  /** 启动时载入心情：读 localStorage，按距上次保存的时长补算衰减，再写回。 */
  loadMood() {
    const p = this.moodParams();
    let v = p.initial;
    let t = Date.now();
    try {
      const raw = window.localStorage.getItem(moodKeyOf(this.pet.id));
      if (raw) {
        const o = JSON.parse(raw);
        if (Number.isFinite(o && o.v)) v = o.v;
        if (Number.isFinite(o && o.t)) t = o.t;
      }
    } catch {
      /* 读不到/坏数据：从初始值开始 */
    }
    this.mood = S.clampMood(S.decayMood(v, Date.now() - t, p.decayPerHour));
    this.moodSavedAt = Date.now();
    this.saveMood();
  },

  /** 写回 localStorage。 */
  saveMood() {
    const p = this.moodParams();
    if (!p.enabled) return;
    try {
      window.localStorage.setItem(
        moodKeyOf(this.pet.id),
        JSON.stringify({ v: S.clampMood(this.mood ?? p.initial), t: Date.now() }),
      );
    } catch {
      /* 存不了就算了，本会话内仍有效 */
    }
  },

  /** 当前档位（low / normal / high）。 */
  moodTier() {
    const p = this.moodParams();
    return S.moodTier(this.mood ?? p.initial, p.low, p.high);
  },

  /**
   * 摸它：心情 +gain（默认 touchGain），夹在 0~100，写回。
   * @returns 本次点击后是否由彩蛋接管动画（点满触发，或彩蛋进行中）——调用方据此跳过普通点击台词/动画。
   */
  touchMood(gain) {
    const p = this.moodParams();
    if (!p.enabled) return false;
    const g = Number.isFinite(gain) ? gain : p.touchGain;
    this.mood = S.clampMood((this.mood ?? p.initial) + g);
    this.moodSavedAt = Date.now();
    this.saveMood();
    // 点满（到 100）就触发一次「原地冲刺跑」彩蛋（_exciteRunning 防重复触发）
    if (this.mood >= 100 && !this._exciteRunning) this.triggerExcite();
    // 彩蛋进行中同样返回 true：期间点击不再用普通点击动画/台词覆盖它
    return this._exciteRunning === true;
  },

  /** 定时衰减（由 startLoops 定期调用）：按与上次保存的时间差补算。 */
  decayMoodTick() {
    const p = this.moodParams();
    if (!p.enabled) return;
    const now = Date.now();
    this.mood = S.clampMood(S.decayMood(this.mood ?? p.initial, now - (this.moodSavedAt ?? now), p.decayPerHour));
    this.moodSavedAt = now;
    this.saveMood();
  },

  /**
   * 彩蛋：心情点满到 100 时触发 —— 播一次「原地冲刺跑」，播完随机掉一点心情，
   * 但结果始终保持在 60 以上（落在 61~99）。
   */
  triggerExcite() {
    if (this._exciteRunning) return;
    this._exciteRunning = true;
    // 兜底：万一动作没触发 ended（视频异常/被切走）没走到结算，15s 后强制结算，避免永久点不动
    if (this._exciteSafety) window.clearTimeout(this._exciteSafety);
    this._exciteSafety = window.setTimeout(() => {
      this._exciteSafety = null;
      this.finishExcite();
    }, 15000);
    // 内存里标记「彩蛋进行中」；saveMood 会 clamp 回 100，落盘仍是满值
    this.mood = 101;
    this.moodSavedAt = Date.now();
    this.saveMood();
    this.showWhisper('心情满格！原地冲刺跑～', undefined, undefined, 6000, false);
    // 只执行「原地冲刺跑」这个动作（与右键菜单点播同一入口）；播完由 handleEnded 调用 finishExcite 结算
    this.playOnce('原地冲刺跑');
  },

  /**
   * 彩蛋收尾：随机掉心情，但结果必须 >60（落在 61~99）；写回 localStorage 后解锁。
   * 由 handleEnded（动作播完）或 triggerExcite 的兜底超时调用；重复调用无副作用。
   */
  finishExcite() {
    if (!this._exciteRunning) return;
    this._exciteRunning = false;
    if (this._exciteSafety) {
      window.clearTimeout(this._exciteSafety);
      this._exciteSafety = null;
    }
    // 随机掉心情：从满值掉 1~39 点 → 61~99，恒大于 60
    this.mood = S.clampMood(61 + Math.floor(Math.random() * 39));
    this.moodSavedAt = Date.now();
    this.saveMood();
    this.showWhisper(
      '心情 ' + this.mood + '/100（' + S.moodLabel(this.moodTier()) + '）',
      undefined,
      undefined,
      4000,
      false,
    );
  },

  /** 气泡显示当前心情（悬浮时用；duration 给足，离开时由 onMouseMove 收起）。 */
  showMoodOnHover() {
    const p = this.moodParams();
    if (!p.enabled) return;
    const v = S.clampMood(this.mood ?? p.initial);
    const tier = this.moodTier();
    this.showWhisper('心情 ' + v + '/100（' + S.moodLabel(tier) + '）', undefined, undefined, 600000, false);
  },
});
