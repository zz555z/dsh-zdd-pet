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
export declare const DEFAULT_FESTIVAL: FestivalParams;
/** 解析 festival 段；缺失/非法 → 默认值。 */
export declare function readFestivalParams(raw: unknown): FestivalParams;
/**
 * festival 段校验：enabled 布尔；cooldownHours 若出现须为 1~720 的有限数字（缺省合法，读取侧回填默认）；
 * texts / animations 若存在必须是对象（值非字符串会被读取侧过滤，不整体判非法）。
 */
export declare function festivalValid(value: unknown): boolean;
