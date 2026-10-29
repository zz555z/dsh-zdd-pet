/**
 * 余额告急搞怪演出 —— 用量快耗尽时，让桌宠跳出来演一段。
 *
 * 口径提醒：balancePercent 是**已用百分比**（0 = 没用过，100 = 用光），
 * 所以"余额低于 10%" = percent ≥ 90。别把方向搞反。
 *
 * 防刷屏是这里的核心（用户选的是"只弹一次"）：
 *   ① 阈值：只有跨过 threshold 才触发，没跨过无论如何不弹；
 *   ② 冷却：触发后 cooldownMs 内不再触发（默认 1 小时）；
 *   ③ 回落重置：百分比掉回阈值以下（额度重置/换服务商）→ 清掉冷却，下次耗尽还能再提醒。
 * 状态是内存态（进程内），重启即清空——够用，不必落盘。
 */

export interface BalanceGagConfig {
  enabled: boolean;
  /** 已用百分比阈值（≥ 此值视为告急）；0~100 */
  thresholdPercent: number;
  /** 冷却毫秒 */
  cooldownMs: number;
  texts: string[];
  /** 配图（表情包池内的名字）；空则纯文字 */
  images: string[];
}

export const BALANCE_GAG_DEFAULT_THRESHOLD = 90;
export const BALANCE_GAG_DEFAULT_COOLDOWN_MS = 60 * 60 * 1000; // 1 小时
export const BALANCE_GAG_DEFAULT_TEXTS = ['额……额度快没啦，省着点用～', '钱包在哭，快见底了'];
export const BALANCE_GAG_DEFAULT_IMAGES = ['完蛋了把黄油删了', '死掉了'];

/** 解析配置；enabled 不显式 true → undefined（默认关闭） */
export function parseBalanceGag(raw: unknown): BalanceGagConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as {
    enabled?: unknown;
    thresholdPercent?: unknown;
    cooldownMin?: unknown;
    texts?: unknown;
    images?: unknown;
  };
  if (r.enabled !== true) return undefined;
  const th = Number(r.thresholdPercent);
  const thresholdPercent = Number.isFinite(th) && th > 0 && th <= 100 ? th : BALANCE_GAG_DEFAULT_THRESHOLD;
  const cm = Number(r.cooldownMin);
  const cooldownMs = Number.isFinite(cm) && cm >= 0 ? cm * 60 * 1000 : BALANCE_GAG_DEFAULT_COOLDOWN_MS;
  const texts = Array.isArray(r.texts)
    ? r.texts.filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    : [];
  const images = Array.isArray(r.images)
    ? r.images.filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    : [];
  return {
    enabled: true,
    thresholdPercent,
    cooldownMs,
    texts: texts.length > 0 ? texts : BALANCE_GAG_DEFAULT_TEXTS,
    images: images.length > 0 ? images : BALANCE_GAG_DEFAULT_IMAGES,
  };
}

/** 额度告急的内存态：上次触发时点 + 是否已处于"告急态"（用于回落重置） */
export interface BalanceGagState {
  lastFireAt: number;
  armed: boolean; // true = 上次采样已在告急区（不重复触发）；false = 正常区
}

export function newBalanceGagState(): BalanceGagState {
  return { lastFireAt: 0, armed: false };
}

/**
 * 一次采样 → 是否该演。
 * @param cfg 告急阈值与冷却配置
 * @param state 告急内存态（触发后会就地推进）
 * @param percent 已用百分比（0~100；undefined = 给不出，跳过）
 * @param now 当前时间戳（可注入，便于单测）
 * @returns 该演则返回 true，并把 state 推进（lastFireAt=now、armed=true）
 */
export function shouldFireBalanceGag(
  cfg: BalanceGagConfig,
  state: BalanceGagState,
  percent: number | undefined,
  now: number,
): boolean {
  if (percent === undefined || !Number.isFinite(percent)) return false;
  const over = percent >= cfg.thresholdPercent;
  if (!over) {
    // 回落到阈值以下：解除"已告急"锁定，下次再耗尽还能提醒（清冷却）
    state.armed = false;
    state.lastFireAt = 0;
    return false;
  }
  if (state.armed) return false; // 已在告急区，不重复
  // 冷却只在**曾经弹过**之后生效（lastFireAt>0）。否则 lastFireAt=0 时 now-0 恒小于冷却时长，
  // 首次永远弹不出来——这是单测抓到的真 bug。
  if (state.lastFireAt > 0 && now - state.lastFireAt < cfg.cooldownMs) {
    state.armed = true; // 冷却中：标记已告急，避免冷却结束后马上又弹
    return false;
  }
  state.lastFireAt = now;
  state.armed = true;
  return true;
}

/** 抽一条演出（文案 + 可选图）；rand 可注入 */
export function pickBalanceGag(
  cfg: BalanceGagConfig,
  rand: () => number = Math.random,
): { text: string; image?: string } {
  const texts = cfg.texts.length > 0 ? cfg.texts : BALANCE_GAG_DEFAULT_TEXTS;
  const images = cfg.images;
  const text = texts[Math.min(texts.length - 1, Math.floor(rand() * texts.length))];
  const image = images.length > 0 ? images[Math.min(images.length - 1, Math.floor(rand() * images.length))] : undefined;
  return image ? { text, image } : { text };
}
