/**
 * 工作状态联动：档位常量与快照解析。
 * 宿主半侧有自包含的实现（DSH 单文件加载约束，宿主不 import 本目录），负责监听 DSH 会话事件
 * 聚合成快照并写进 /state 的 sections.workStatus；本模块只有档位常量与叶子解析。
 * 气泡文案不在代码里：浏览器半侧直接读配置的 events.workStatusTexts。纯函数无副作用，不依赖 React / DOM。
 * @module dsh-zdd-pet/src/shared/work-status
 */

/** 工作状态档位（对应 animations.events.workStatus 数组索引，顺序即档位，勿在中间插入新档）。 */
export const WORK_STATUS_STATES = ['thinking', 'working', 'result', 'waiting', 'success', 'error'] as const;
export type WorkStatusState = (typeof WORK_STATUS_STATES)[number];

/** 档位 → workStatus 数组索引（与 events.workStatus 的顺序严格一致）。 */
export const WORK_STATUS_INDEX: Record<WorkStatusState, number> = {
  thinking: 0, // turn/start → 思考
  working: 1, // tool/call → 工作
  result: 2, // tool/result → 整理
  waiting: 3, // approval/asked → 等待
  success: 4, // turn/end completed → 完成
  error: 5, // turn/end error/max-tokens → 出错
};

/** 清单进度（done 已勾选 / total 总条数，与 host 的 TaskProgress 同构）。 */
export interface TaskProgress {
  done: number;
  total: number;
}

/** 工作状态快照（= /state 里 sections.workStatus 的 data，与宿主半侧的同构）。
 *  没有 ts：「变了没有」由叶子的 counter 承担；text 不在此——气泡文案由客户端读配置，宿主不生成。 */
export interface WorkStatusSnapshot {
  state: WorkStatusState | null; // null = 空闲
  task: string | null; // 当前任务详情（todo/write 提供，可 null）
  progress: TaskProgress | null; // 清单进度 done/total（todo/write 提供，可 null）
}

/** 快照解析：档位不认识 → 归一成 null（空闲）；形状非法 → null，消费端跳过这一拍。
 *  progress 是后加的字段：老 host / 老快照里没有它 → 归一成 null（等价于「无清单进度」），
 *  因此新旧 host 与两端渲染可以任意混搭，不必同步升级。 */
export function toWorkStatus(raw: unknown): WorkStatusSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { state?: unknown; task?: unknown; progress?: unknown };
  const state: WorkStatusState | null =
    r.state === null || (typeof r.state === 'string' && (WORK_STATUS_STATES as readonly string[]).includes(r.state))
      ? (r.state as WorkStatusState | null)
      : null;
  const p = r.progress as { done?: unknown; total?: unknown } | null | undefined;
  const done = Number(p?.done);
  const total = Number(p?.total);
  const progress: TaskProgress | null =
    p && typeof p === 'object' && Number.isInteger(done) && Number.isInteger(total) && total > 0 && done >= 0
      ? { done: Math.min(done, total), total }
      : null;
  return { state, task: typeof r.task === 'string' ? r.task : null, progress };
}

/** 任务详情是否「正在展示」：有清单进度或有任务文案。
 *  两端气泡槽位用它判定「有任务」——有任务时碎碎念/余额一律让位（进度气泡优先），
 *  只有没任务时它们才能占用气泡。与 host 的 hasTask 同一判据。 */
export function hasTask(ws: { task?: string | null; progress?: TaskProgress | null } | null): boolean {
  return Boolean(ws && ((ws.task ?? null) !== null || (ws.progress ?? null) !== null));
}

/** 进度条最大格数：清单几十条时全画会撑爆气泡（40 条=40 方块），超过就按比例归一到 10 格。
 *  10 格在默认字号下刚好一行，一瞥能看出进度比例。 */
export const PROGRESS_BAR_MAX_SLOTS = 10;

/**
 * 进度条：「▰▰▰▱▱▱▱▱▱▱」（已完成格 / 总格数）；无清单 → null。
 *
 * 为什么用 Unicode 方块而不是 CSS：气泡是两端（网页 React + 桌面 innerHTML）各自渲染的，
 * CSS 方案要写两份样式且容易走样；方块字符是纯文本，两端天然逐字一致。
 * 槽位算法：total ≤ 10 → 一格一条（精确）；total > 10 → 归一到 10 格，四舍五入，
 * 保证 done=total 满格、done=0 全空。slots 至少 1，避免 total=0 出现空串。
 */
export function progressBar(ws: { progress?: TaskProgress | null } | null): string | null {
  const p = ws?.progress ?? null;
  if (!p || p.total <= 0) return null;
  const slots = Math.min(p.total, PROGRESS_BAR_MAX_SLOTS);
  const filled = Math.max(0, Math.min(slots, Math.round((p.done / p.total) * slots)));
  return '▰'.repeat(filled) + '▱'.repeat(slots - filled);
}

/**
 * 气泡里的完整进度文案：「▰▰▱▱▱  2/5」——方块条在前，数字在后（数字给精确值，方块给比例感）。
 * 无清单 → null。两端都调这一个函数，保证逐字一致。
 */
export function progressText(ws: { progress?: TaskProgress | null } | null): string | null {
  const bar = progressBar(ws);
  const p = ws?.progress ?? null;
  if (!bar || !p) return null;
  return `${bar}  ${p.done}/${p.total}`;
}
