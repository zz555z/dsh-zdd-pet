/**
 * 亲密度阶段系统的纯逻辑（浏览器与桌面端共用）。
 *
 * 在既有心情数值（mood 0~100）之上再切出四个「阶段」，给桌宠一条成长故事线：
 * 陌生 → 熟悉 → 亲近 → 默契。每阶段带一份专属点击台词、一句阶段标语、一个专属节日名
 * （首次达到某阶段的周年日 = 该阶段的「纪念日」，由 host/festival.ts 触发演出）。
 *
 * 只做数值→阶段的判定与阶段属性查询，不碰存储 / DOM / 定时器（那些在两端各自实现）。
 * @module dsh-zdd-pet/src/shared/intimacy
 */
/** 亲密度阶段（由低到高）。 */
export type IntimacyTier = 'stranger' | 'familiar' | 'close' | 'bonded';
/** 阶段顺序（索引越大越亲密）。 */
export declare const INTIMACY_TIERS: readonly IntimacyTier[];
/** 一个阶段的属性。 */
export interface IntimacyStage {
    /** 阶段中文名（悬浮提示 / 气泡用） */
    label: string;
    /** 一句阶段标语（达成时播报，或悬浮展示） */
    motto: string;
    /** 该阶段的专属点击台词池（心情启用时优先于 mood.texts 使用） */
    texts: string[];
    /** 达成该阶段纪念日时的节日名（可为空 = 不设纪念日） */
    festival?: string;
    /** 达成该阶段纪念日时的祝福/台词（可为空 = 用通用模板） */
    festivalText?: string;
}
/** config.jsonc 的 intimacy 段。 */
export interface IntimacyParams {
    /** 是否启用亲密度阶段（关闭则只保留原有 mood 三档行为，不播阶段解锁/纪念日） */
    enabled: boolean;
    /** 四个阶段各自的属性（键固定为四个阶段名）。 */
    stages: Record<IntimacyTier, IntimacyStage>;
}
/** 阶段边界（含下界）：数值 >= 该阈值即进入此阶段。 */
export declare const INTIMACY_THRESHOLDS: Readonly<Record<IntimacyTier, number>>;
/** 内置默认（与 assets/config.jsonc 的 intimacy 段保持一致，改一处须同步另一处）。 */
export declare const DEFAULT_INTIMACY: IntimacyParams;
/** 由数值判阶段：取数值 ≥ 阈值里最高的那一档。 */
export declare function intimacyTierOf(value: number): IntimacyTier;
/** 阶段的中文序号（0..3，用于比较「是否升级」）。 */
export declare function intimacyRank(tier: IntimacyTier): number;
/** 读某阶段的属性（缺省回退到内置默认同名阶段）。 */
export declare function intimacyStageOf(params: IntimacyParams, tier: IntimacyTier): IntimacyStage;
/**
 * 阶段专属点击台词池：有非空台词就用它，否则回退传入的兜底池（通常是 mood 台词或 clickTexts）。
 */
export declare function intimacyTextPool(params: IntimacyParams, tier: IntimacyTier, fallback?: readonly string[]): readonly string[];
/** 某阶段是否是「阶段达成」需要庆祝：stranger 是起始态，不庆祝。 */
export declare function isPromotion(from: IntimacyTier, to: IntimacyTier): boolean;
/** 解析 config 的 intimacy 段；缺失/非法 → 默认值。 */
export declare function readIntimacyParams(raw: unknown): IntimacyParams;
/**
 * intimacy 段校验：enabled 必须是布尔；stages 若出现必须是对象（子字段非法会被读取侧逐项过滤，
 * 不整体判非法）。
 */
export declare function intimacyValid(value: unknown): boolean;
