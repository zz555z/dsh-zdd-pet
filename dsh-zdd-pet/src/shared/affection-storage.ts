/** 为双端注入存储能力，隔离 JSON 损坏及不可用的 localStorage。 */
import { AFFECTION_KEY_PREFIX, restoreAffection } from './affection-state.ts';
import type { AffectionState } from './affection-state.ts';

/** 仅依赖 localStorage 的同步读写子集。 */
export interface AffectionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** 首次读取新状态时立即保存迁移结果，保证后续不再从旧心情重建亲密度。 */
export function loadAffection(
  storage: AffectionStorage | undefined,
  petId: string,
  initial: number,
  now: number,
): AffectionState {
  const state = restoreAffection({
    stored: readJson(storage, AFFECTION_KEY_PREFIX + petId),
    legacy: readJson(storage, 'dsh-zdd-pet-mood-' + petId),
    initial,
    now,
  });
  saveAffection(storage, petId, state);
  return state;
}

/** 尽力保存完整版本化状态；介质不可用时由调用方保留会话内状态。 */
export function saveAffection(storage: AffectionStorage | undefined, petId: string, state: AffectionState): void {
  try {
    storage?.setItem(AFFECTION_KEY_PREFIX + petId, JSON.stringify(state));
  } catch {
    // 浏览器隐私模式和存储配额可能拒绝写入。
  }
}

function readJson(storage: AffectionStorage | undefined, key: string): unknown {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}
