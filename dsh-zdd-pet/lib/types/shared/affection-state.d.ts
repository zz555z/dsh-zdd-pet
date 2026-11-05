/** 双端共用的新状态键前缀；旧心情键只在首次迁移时读取。 */
export declare const AFFECTION_KEY_PREFIX = "dsh-zdd-pet-affection-v1-";
/** 独立保存短期心情、长期亲密度及心情结算时刻。 */
export interface AffectionState {
    readonly stateVersion: 1;
    readonly mood: number;
    readonly intimacy: number;
    /** 心情已结算到的 Unix 毫秒数。 */
    readonly savedAt: number;
}
/** 从新状态恢复，或把旧心情原值一次性迁入长期亲密度。 */
export declare function restoreAffection(input: {
    readonly stored: unknown;
    readonly legacy: unknown;
    readonly initial: number;
    readonly now: number;
}): AffectionState;
/** 结算到指定时刻，只衰减心情，时钟回拨时保留原结算时刻。 */
export declare function decayAffection(state: AffectionState, now: number, rate: number): AffectionState;
/** 互动同时增加心情和亲密度；负向心情变化不会扣除长期亲密度。 */
export declare function touchAffection(state: AffectionState, gain: number): AffectionState;
