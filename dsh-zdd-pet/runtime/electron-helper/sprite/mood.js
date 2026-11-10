/**
 * 心情 / 亲密度（桌面端）：localStorage 持久化 + 摸它涨 + 久不理随时间衰减。
 *
 * 纯算法在 shared-core（S.readMoodParams / clampMood / moodTier / decayMood / moodLabel），
 * 本文件只负责「存取 + 定时 + 接到气泡/菜单」。心情值随宠物实例（petId）单独存。
 * 必须在其后加载：sprite.js（PetSprite 定义）。
 * @module dsh-zdd-pet/runtime/electron-helper/sprite-mood
 */
'use strict';

/** 存储受限时仍允许会话内互动。 */
function affectionStorage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

Object.assign(PetSprite.prototype, {
  /** 当前心情配置（含默认值兜底）。 */
  moodParams() {
    return S.readMoodParams(this.pet.mood);
  },

  /** 启动时载入心情：读 localStorage，按距上次保存的时长补算衰减，再写回。 */
  loadMood() {
    const p = this.moodParams();
    const now = Date.now();
    const stored = S.loadAffection(affectionStorage(), this.pet.id, p.initial, now);
    const state = p.enabled ? S.decayAffection(stored, now, p.decayPerHour) : { ...stored, savedAt: now };
    this.mood = state.mood;
    this.intimacy = state.intimacy;
    this.moodSavedAt = state.savedAt;
    this.saveMood();
  },

  /** 写回独立心情和亲密度的完整版本化状态。 */
  saveMood() {
    S.saveAffection(affectionStorage(), this.pet.id, {
      stateVersion: 1,
      mood: S.clampMood(this.mood ?? this.moodParams().initial),
      intimacy: S.clampMood(this.intimacy ?? this.moodParams().initial),
      savedAt: this.moodSavedAt ?? Date.now(),
    });
  },

  /** 当前档位（low / normal / high）。 */
  moodTier() {
    const p = this.moodParams();
    return S.moodTier(this.mood ?? p.initial, p.low, p.high);
  },

  /** 当前亲密度阶段参数（含默认值兜底）。 */
  intimacyParams() {
    return S.readIntimacyParams(this.pet.intimacy);
  },

  /** 当前亲密度阶段（stranger / familiar / close / bonded）。 */
  intimacyTier() {
    return S.intimacyTierOf(this.intimacy ?? 0);
  },

  /** 亲密度阶段中文名（形如「亲近」）。 */
  intimacyLabel() {
    const ip = this.intimacyParams();
    return S.intimacyStageOf(ip, this.intimacyTier()).label;
  },

  /**
   * 摸它：心情 +gain（默认 touchGain），夹在 0~100，写回。
   * @returns 本次点击后是否由彩蛋接管动画（点满触发，或彩蛋进行中）——调用方据此跳过普通点击台词/动画。
   */
  touchMood(gain) {
    const p = this.moodParams();
    if (!p.enabled) return false;
    const prevTier = this.intimacyTier();
    const g = Number.isFinite(gain) ? gain : p.touchGain;
    const touched = S.touchAffection(
      S.decayAffection(
        {
          stateVersion: 1,
          mood: this.mood ?? p.initial,
          intimacy: this.intimacy ?? p.initial,
          savedAt: this.moodSavedAt ?? Date.now(),
        },
        Date.now(),
        p.decayPerHour,
      ),
      g,
    );
    this.mood = touched.mood;
    this.intimacy = touched.intimacy;
    this.moodSavedAt = touched.savedAt;
    this.saveMood();
    // 亲密度阶段升级：播一句阶段专属标语（彩蛋进行中不抢戏）。
    const ip = this.intimacyParams();
    if (ip.enabled) {
      const nextTier = this.intimacyTier();
      if (S.intimacyRank(nextTier) > S.intimacyRank(prevTier)) {
        const stage = S.intimacyStageOf(ip, nextTier);
        if (!this._exciteRunning)
          this.showWhisper('【' + stage.label + '】' + stage.motto, undefined, undefined, 6000, false);
        // 上报宿主：记录首次达到该阶段（供周年纪念日演出）。日期取本地 Y-M-D。
        const d = new Date();
        const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
        S.postAction(
          BASE +
            '/intimacy?pet=' +
            encodeURIComponent(this.pet.id) +
            '&stage=' +
            encodeURIComponent(nextTier) +
            '&date=' +
            encodeURIComponent(key),
          { recorded: true },
        ).catch(() => {});
      }
    }
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
    this.moodSavedAt = Math.max(this.moodSavedAt ?? now, now);
    this.saveMood();
  },

  /**
   * 彩蛋：心情点满到 100 时触发 —— 朝最近屏幕边缘冲刺撞墙，接触点炸开暖色粒子；
   * 撞回后随机掉一点心情，但结果始终保持在 60 以上（落在 61~99）。
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
    // 撞墙打粒子：每次反弹在接触点爆一圈暖色粒子；第一次撞到就弹气泡。
    const self = this;
    let bounced = false;
    const onBounce = (x, y) => {
      if (typeof S.spawnScoreBurst === 'function') S.spawnScoreBurst(x, y);
      if (!bounced) {
        bounced = true;
        self.showWhisper('心情满格！撞一下～', undefined, undefined, 4000, false);
      }
      // 撞过墙后给个较短的收尾窗口，弹回一两次就结算。
      if (self._exciteAfterBounce) window.clearTimeout(self._exciteAfterBounce);
      self._exciteAfterBounce = window.setTimeout(() => {
        self._exciteAfterBounce = null;
        self.finishExcite();
      }, 900);
    };
    // 起飞成功就交给物理；失败（拖拽中）退化为原地冲刺跑。
    const launched = this.celebrate(onBounce);
    if (!launched) {
      this.showWhisper('心情满格！原地冲刺跑～', undefined, undefined, 6000, false);
      this.playOnce('原地冲刺跑');
    }
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
    if (this._exciteAfterBounce) {
      window.clearTimeout(this._exciteAfterBounce);
      this._exciteAfterBounce = null;
    }
    // 清掉撞墙回调，避免之后的正常抛掷误打粒子。
    if (this.clearBounceHandler) this.clearBounceHandler();
    // 随机掉心情：从满值掉 1~39 点 → 61~99，恒大于 60
    this.mood = S.clampMood(61 + Math.floor(Math.random() * 39));
    this.moodSavedAt = Date.now();
    this.saveMood();
    this.showWhisper(
      '心情 ' + S.displayMood(this.mood) + '/100（' + S.moodLabel(this.moodTier()) + '）',
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
    // 有常驻气泡（任务完成 / 等待确认）时不要用心情悬浮气泡把它顶掉——否则鼠标一碰
    // 完成气泡就被心情气泡覆盖（表现为「碰到就消失」）。
    if (this.whisperHoldKind) return;
    const v = S.displayMood(this.mood ?? p.initial);
    const tier = this.moodTier();
    const ip = this.intimacyParams ? this.intimacyParams() : null;
    const stageSuffix = ip && ip.enabled ? ' · ' + this.intimacyLabel() : '';
    this.showWhisper(
      '心情 ' + v + '/100（' + S.moodLabel(tier) + '）' + stageSuffix,
      undefined,
      undefined,
      600000,
      false,
    );
  },
});
