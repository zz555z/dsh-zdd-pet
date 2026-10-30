/**
 * 节日自动演出的配置形状、默认值与校验（宿主读取用；纯逻辑，不碰日期与 IO）。
 *
 * 实际「今天是什么节日 / 播哪段动画」在 host/festival.ts：那里复用 time-context 的节日表。
 * 配置为条目级（与 greeting 同级），可被 pet/<名>-config.json 顶层覆盖。
 * @module dsh-zdd-pet/src/shared/festival
 */

/** config.jsonc 的 festival 段。 */
export interface FestivalParams {
  /** 是否启用节日自动演出 */
  enabled: boolean;
  /**
   * 同一天最多只演一次的冷却（小时）：跨重启按日期去重，这里保留给以后做「同日多次启动」策略。
   * 目前按自然日去重（见 host/festival.ts 的 last 文件），此值只做范围校验。
   */
  cooldownHours: number;
  /** 按节日名覆盖文案（可选）；没写的节日用内置祝福语。 */
  texts: Record<string, string>;
  /** 按节日名覆盖动画名（可选）；没写的节日用内置映射。 */
  animations: Record<string, string>;
}

/** 内置默认（与 assets/config.jsonc 的 festival 段保持一致）。 */
export const DEFAULT_FESTIVAL: FestivalParams = {
  enabled: true,
  cooldownHours: 20,
  texts: {},
  animations: {},
};

/** 字符串→字符串表：只收非空字符串键值（其余过滤掉，不整体判非法）。 */
function stringMap(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim() !== '') out[k] = v;
  }
  return out;
}

/** 解析 festival 段；缺失/非法 → 默认值。 */
export function readFestivalParams(raw: unknown): FestivalParams {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_FESTIVAL };
  const o = raw as Record<string, unknown>;
  const n = Number(o.cooldownHours);
  return {
    enabled: o.enabled !== false,
    cooldownHours: Number.isFinite(n) && n >= 1 && n <= 24 * 30 ? n : DEFAULT_FESTIVAL.cooldownHours,
    texts: stringMap(o.texts),
    animations: stringMap(o.animations),
  };
}

/**
 * festival 段校验：enabled 布尔；cooldownHours 若出现须为 1~720 的有限数字（缺省合法，读取侧回填默认）；
 * texts / animations 若存在必须是对象（值非字符串会被读取侧过滤，不整体判非法）。
 */
export function festivalValid(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.enabled !== 'boolean') return false;
  if (o.cooldownHours !== undefined) {
    const n = Number(o.cooldownHours);
    if (!Number.isFinite(n) || n < 1 || n > 24 * 30) return false;
  }
  if (o.texts !== undefined && (typeof o.texts !== 'object' || o.texts === null || Array.isArray(o.texts)))
    return false;
  if (
    o.animations !== undefined &&
    (typeof o.animations !== 'object' || o.animations === null || Array.isArray(o.animations))
  ) {
    return false;
  }
  return true;
}
