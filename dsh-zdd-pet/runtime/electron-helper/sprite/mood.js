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

  /** 摸它：心情 +gain（默认 touchGain），夹在 0~100，写回。 */
  touchMood(gain) {
    const p = this.moodParams();
    if (!p.enabled) return;
    const g = Number.isFinite(gain) ? gain : p.touchGain;
    this.mood = S.clampMood((this.mood ?? p.initial) + g);
    this.moodSavedAt = Date.now();
    this.saveMood();
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

  /** 气泡显示当前心情（悬浮时用；duration 给足，离开时由 onMouseMove 收起）。 */
  showMoodOnHover() {
    const p = this.moodParams();
    if (!p.enabled) return;
    const v = S.clampMood(this.mood ?? p.initial);
    const tier = this.moodTier();
    this.showWhisper('心情 ' + v + '/100（' + S.moodLabel(tier) + '）', undefined, undefined, 600000, false);
  },
});
