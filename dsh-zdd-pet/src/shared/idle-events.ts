/**
 * 随机小事件的纯逻辑（浏览器与桌面端共用）。
 *
 * 「不靠触发也有生命力」：空闲时每隔一段随机时间，让桌宠自己做个动作（伸懒腰、看窗外、打哈欠…），
 * 偶尔配一句拟声/短句。事件池来自配置，抽签算法在这里，定时与播放由两端各自实现。
 *
 * 只做数据形状、默认值与抽取，不碰 DOM / 定时器。
 * @module dsh-zdd-pet/src/shared/idle-events
 */

/** 一个随机小事件。 */
export interface IdleEvent {
  /** 要播的动画名（须在本宠物动画池里存在，否则两端会跳过） */
  anim: string;
  /** 可选气泡文案（空 = 只播动画不说） */
  text?: string;
}

/** config.jsonc 的 idleEvents 段。 */
export interface IdleEventsParams {
  /** 是否启用随机小事件 */
  enabled: boolean;
  /** 两次事件之间的最短间隔（秒） */
  minGapSec: number;
  /** 两次事件之间的最长间隔（秒） */
  maxGapSec: number;
  /** 事件池 */
  events: IdleEvent[];
}

/** 间隔上下限（秒）：下界 20，上界 1 天。 */
export const IDLE_GAP_MIN_SEC = 20;
export const IDLE_GAP_MAX_SEC = 24 * 60 * 60;

/** 内置默认（与 assets/config.jsonc 的 idleEvents 段保持一致）。 */
export const DEFAULT_IDLE_EVENTS: IdleEventsParams = {
  enabled: true,
  minGapSec: 90,
  maxGapSec: 300,
  events: [
    { anim: '超大伸懒腰', text: '哈——伸个懒腰～' },
    { anim: '哈欠连天', text: '唔…有点困了…' },
    { anim: '小幅度原地360度旋转展示', text: '转个圈圈～' },
    { anim: '东张西望', text: '外面在干嘛呀？' },
  ],
};

/** 抽签：从非空事件池里随机抽一个，尽量避开当前正播动画（能避开就别播同一段）。 */
export function pickIdleEvent(pool: readonly IdleEvent[], currentAnim?: string): IdleEvent | undefined {
  const valid = pool.filter((e) => e && typeof e.anim === 'string' && e.anim.trim() !== '');
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];
  const filtered = valid.filter((e) => e.anim !== currentAnim);
  const from = filtered.length > 0 ? filtered : valid;
  return from[Math.floor(Math.random() * from.length)];
}

/** [min,max] 之间取一个毫秒间隔（顺序颠倒则交换；非法回退默认）。 */
export function randomIdleGapMs(params: IdleEventsParams): number {
  let lo = Number(params.minGapSec);
  let hi = Number(params.maxGapSec);
  if (!Number.isFinite(lo) || lo < IDLE_GAP_MIN_SEC) lo = DEFAULT_IDLE_EVENTS.minGapSec;
  if (!Number.isFinite(hi) || hi < lo) hi = Math.max(lo, DEFAULT_IDLE_EVENTS.maxGapSec);
  const sec = lo + Math.random() * (hi - lo);
  return Math.round(sec * 1000);
}

/** 解析 config 的 idleEvents 段；缺失/非法 → 默认值。 */
export function readIdleEventsParams(raw: unknown): IdleEventsParams {
  const d = DEFAULT_IDLE_EVENTS;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      enabled: d.enabled,
      minGapSec: d.minGapSec,
      maxGapSec: d.maxGapSec,
      events: d.events.map((e) => ({ ...e })),
    };
  }
  const o = raw as Record<string, unknown>;
  const num = (v: unknown, fb: number, min: number, max: number): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : fb;
  };
  let minGapSec = num(o.minGapSec, d.minGapSec, IDLE_GAP_MIN_SEC, IDLE_GAP_MAX_SEC);
  let maxGapSec = num(o.maxGapSec, d.maxGapSec, IDLE_GAP_MIN_SEC, IDLE_GAP_MAX_SEC);
  if (maxGapSec < minGapSec) [minGapSec, maxGapSec] = [maxGapSec, minGapSec];
  const events: IdleEvent[] = Array.isArray(o.events)
    ? o.events
        .map((raw2): IdleEvent | null => {
          if (!raw2 || typeof raw2 !== 'object' || Array.isArray(raw2)) return null;
          const e = raw2 as Record<string, unknown>;
          if (typeof e.anim !== 'string' || e.anim.trim() === '') return null;
          const text = typeof e.text === 'string' && e.text.trim() !== '' ? e.text : undefined;
          return text ? { anim: e.anim, text } : { anim: e.anim };
        })
        .filter((e): e is IdleEvent => e !== null)
    : d.events.map((e) => ({ ...e }));
  return { enabled: o.enabled !== false, minGapSec, maxGapSec, events };
}

/**
 * idleEvents 段校验：enabled 布尔；minGapSec / maxGapSec 若出现须在 [20, 86400]；
 * events 若出现必须是数组（坏条目由读取侧过滤，不整体判非法）。
 */
export function idleEventsValid(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.enabled !== 'boolean') return false;
  for (const key of ['minGapSec', 'maxGapSec'] as const) {
    if (o[key] === undefined) continue;
    const n = Number(o[key]);
    if (!Number.isFinite(n) || n < IDLE_GAP_MIN_SEC || n > IDLE_GAP_MAX_SEC) return false;
  }
  if (o.events !== undefined && !Array.isArray(o.events)) return false;
  return true;
}
