export interface SayOptions {
    readonly source: string;
    readonly id?: string;
    readonly priority?: number;
    readonly expiresAt?: number;
}
/** 保留旧说话载荷；新增元数据只用于归属与精确清除。 */
export interface SayPayload {
    readonly text?: string;
    readonly duration?: number;
    readonly hold?: boolean;
    readonly [key: string]: unknown;
}
/** 清除必须指明来源或消息身份；counter 由状态存储检查。 */
export interface SayClear {
    readonly source?: string;
    readonly messageId?: string;
    readonly expectedCounter?: number;
}
/** 创建一个实例级调度器；stop 后不可复用。 */
export declare function createSayScheduler(project: (petId: string, payload: SayPayload) => void, now?: () => number): {
    publish(petId: string, payload: SayPayload, options: SayOptions): string | undefined;
    clear(petId: string, match: SayClear): boolean;
    stop(): void;
};
