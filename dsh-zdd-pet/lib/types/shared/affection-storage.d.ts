import type { AffectionState } from './affection-state.ts';
/** 仅依赖 localStorage 的同步读写子集。 */
export interface AffectionStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
/** 首次读取新状态时立即保存迁移结果，保证后续不再从旧心情重建亲密度。 */
export declare function loadAffection(storage: AffectionStorage | undefined, petId: string, initial: number, now: number): AffectionState;
/** 尽力保存完整版本化状态；介质不可用时由调用方保留会话内状态。 */
export declare function saveAffection(storage: AffectionStorage | undefined, petId: string, state: AffectionState): void;
