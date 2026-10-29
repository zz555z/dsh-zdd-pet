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
    // 点满（到 100）就触发一次「乱跑」彩蛋（_exciteRunning 防重复触发）
    if (this.mood >= 100 && !this._exciteRunning) this.triggerExcite();
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

  /** 彩蛋：心情拉到 101 触发「到处乱跑」特效，跑完回落到 100。 */
  /** 彩蛋：点击把心情点满到 101 时自动触发 —— 快速绕屏幕一圈 → 摔回原位 → 委屈 → 心情降到 50。 */
  triggerExcite() {
    if (this._exciteRunning) return;
    this._exciteRunning = true;
    // 兜底：万一动画链中途异常没走到复位，22s 后强制解锁，避免永久点不动
    const safety = window.setTimeout(() => {
      this._exciteRunning = false;
    }, 22000);
    this.mood = 101;
    this.moodSavedAt = Date.now();
    this.saveMood();
    this.showWhisper('心情 101！开心到乱跑～', undefined, undefined, 9000, false);
    const W = VIEW.w;
    const H = VIEW.h;
    const origRx = this.currentCenterX() / W;
    const origRy = this.currentCenterY() / H;
    // 真步态乱跑：连续 tryMove（走路引擎自动挑移动动画 + 真实位移），随机换朝向满屏跑一阵
    let runs = 6;
    const run = () => {
      if (runs-- <= 0) {
        // 跑完回原位 → 委屈表情 → 心情降到 50
        this.moveToCenter(origRx, origRy, 'line', 320);
        window.setTimeout(() => {
          this.mood = 50;
          this.moodSavedAt = Date.now();
          this.saveMood();
          this.playOnce('绊倒摔倒'); // 摔倒收尾（跑段与摔倒已拆成两个动作）
          // 恢复常规播放速度
          this._exciteRate = 0;
          if (this.videoA) this.videoA.playbackRate = 1;
          if (this.videoB) this.videoB.playbackRate = 1;
          window.clearTimeout(safety);
          this._exciteRunning = false;
        }, 400);
        return;
      }
      this.facing = Math.random() < 0.5 ? 'left' : 'right';
      // 用「原地冲刺跑」纯跑段大距离跑，一段跨大半屏；设 once=false 循环播放，避免每段播完切到随机动作
      this.tryMove('原地冲刺跑', undefined, { minDist: 1000, maxDist: 2200, leadSec: 0.15, tailSec: 0.15 });
      this.once = false;
      window.setTimeout(run, 2500);
    };
    run();
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
