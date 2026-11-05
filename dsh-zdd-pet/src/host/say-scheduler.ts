/** 宿主说话候选的优先级、归属与过期调度；不持久化、不负责动画。 */
import { sayBubbleDurationMs } from '../shared/timings.ts';

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

interface Candidate {
  payload: SayPayload;
  source: string;
  messageId: string;
  priority: number;
  expiresAt?: number;
  sequence: number;
  shown?: boolean;
}

/** 创建一个实例级调度器；stop 后不可复用。 */
export function createSayScheduler(
  project: (petId: string, payload: SayPayload) => void,
  now: () => number = Date.now,
) {
  const pets = new Map<string, Map<string, Candidate>>();
  const visible = new Map<string, Candidate>();
  let sequence = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const refresh = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    const currentTime = now();
    let nextExpiry = Infinity;
    for (const [petId, candidates] of pets) {
      let winner: Candidate | undefined;
      for (const [source, candidate] of candidates) {
        if (candidate.expiresAt !== undefined && candidate.expiresAt <= currentTime) {
          candidates.delete(source);
          continue;
        }
        nextExpiry = Math.min(nextExpiry, candidate.expiresAt ?? Infinity);
        if (
          !winner ||
          candidate.priority > winner.priority ||
          (candidate.priority === winner.priority && candidate.sequence > winner.sequence)
        )
          winner = candidate;
      }
      if (visible.get(petId) !== winner) {
        if (winner) {
          visible.set(petId, winner);
          project(petId, {
            ...winner.payload,
            ...(winner.shown ? { anim: false } : {}),
            messageId: winner.messageId,
            source: winner.source,
            priority: winner.priority,
            ...(winner.expiresAt === undefined
              ? {}
              : {
                  expiresAt: winner.expiresAt,
                  duration: Math.max(1, winner.expiresAt - currentTime),
                }),
          });
          winner.shown = true;
        } else {
          visible.delete(petId);
          project(petId, { clear: true });
        }
      }
      if (candidates.size === 0) pets.delete(petId);
    }
    if (Number.isFinite(nextExpiry)) {
      timer = setTimeout(refresh, Math.min(2_147_483_647, Math.max(1, nextExpiry - currentTime)));
      timer.unref?.();
    }
  };

  return {
    publish(petId: string, payload: SayPayload, options: SayOptions): string | undefined {
      if (stopped) return undefined;
      if (payload.duration === 0) {
        project(petId, payload);
        return undefined;
      }
      const serial = ++sequence;
      const messageId = options.id ?? `${now()}-${serial}`;
      const priority =
        options.source === 'confirm'
          ? 100
          : options.source === 'complete'
            ? 90
            : (options.priority ?? (options.source === 'pomodoro-countdown' ? 10 : 50));
      const expiresAfterMs =
        payload.duration ?? (typeof payload.text === 'string' ? sayBubbleDurationMs(payload.text) : 10_000);
      const expiresAt = options.expiresAt ?? (payload.hold ? undefined : now() + expiresAfterMs);
      const candidates = pets.get(petId) ?? new Map<string, Candidate>();
      pets.set(petId, candidates);
      candidates.set(options.source, {
        payload,
        source: options.source,
        messageId,
        priority,
        expiresAt,
        sequence: serial,
        ...(options.expiresAt === undefined && !payload.hold ? { expiresAfterMs } : {}),
      });
      refresh();
      return messageId;
    },
    clear(petId: string, match: SayClear): boolean {
      if (stopped || (!match.source && !match.messageId)) return false;
      const candidates = pets.get(petId);
      if (!candidates) return false;
      let removed = false;
      for (const [source, candidate] of candidates) {
        if (match.source && source !== match.source) continue;
        if (match.messageId && candidate.messageId !== match.messageId) continue;
        candidates.delete(source);
        removed = true;
      }
      refresh();
      return removed;
    },
    stop(): void {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      pets.clear();
      visible.clear();
    },
  };
}
