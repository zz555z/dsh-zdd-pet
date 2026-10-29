/**
 * 工作状态联动：档位常量与快照解析。
 * 宿主半侧有自包含的实现（DSH 单文件加载约束，宿主不 import 本目录），负责监听 DSH 会话事件
 * 聚合成快照并写进 /state 的 sections.workStatus；本模块只有档位常量与叶子解析。
 * 气泡文案不在代码里：浏览器半侧直接读配置的 events.workStatusTexts。纯函数无副作用，不依赖 React / DOM。
 * @module dsh-zdd-pet/src/shared/work-status
 */
/** 工作状态档位（对应 animations.events.workStatus 数组索引，顺序即档位，勿在中间插入新档）。 */
export declare const WORK_STATUS_STATES: readonly ["thinking", "working", "result", "waiting", "success", "error"];
export type WorkStatusState = (typeof WORK_STATUS_STATES)[number];
/** 档位 → workStatus 数组索引（与 events.workStatus 的顺序严格一致）。 */
export declare const WORK_STATUS_INDEX: Record<WorkStatusState, number>;
/** 清单进度（done 已勾选 / total 总条数，与 host 的 TaskProgress 同构）。 */
export interface TaskProgress {
    done: number;
    total: number;
}
/** 工作状态快照（= /state 里 sections.workStatus 的 data，与宿主半侧的同构）。
 *  没有 ts：「变了没有」由叶子的 counter 承担；text 不在此——气泡文案由客户端读配置，宿主不生成。 */
export interface WorkStatusSnapshot {
    state: WorkStatusState | null;
    task: string | null;
    progress: TaskProgress | null;
}
/** 快照解析：档位不认识 → 归一成 null（空闲）；形状非法 → null，消费端跳过这一拍。
 *  progress 是后加的字段：老 host / 老快照里没有它 → 归一成 null（等价于「无清单进度」），
 *  因此新旧 host 与两端渲染可以任意混搭，不必同步升级。 */
export declare function toWorkStatus(raw: unknown): WorkStatusSnapshot | null;
/** 任务详情是否「正在展示」：有清单进度或有任务文案。
 *  两端气泡槽位用它判定「有任务」——有任务时碎碎念/余额一律让位（进度气泡优先），
 *  只有没任务时它们才能占用气泡。与 host 的 hasTask 同一判据。 */
export declare function hasTask(ws: {
    task?: string | null;
    progress?: TaskProgress | null;
} | null): boolean;
/** 进度条最大格数：清单几十条时全画会撑爆气泡（40 条=40 方块），超过就按比例归一到 10 格。
 *  10 格在默认字号下刚好一行，一瞥能看出进度比例。 */
export declare const PROGRESS_BAR_MAX_SLOTS = 10;
/**
 * 进度条：「▰▰▰▱▱▱▱▱▱▱」（已完成格 / 总格数）；无清单 → null。
 *
 * 为什么用 Unicode 方块而不是 CSS：气泡是两端（网页 React + 桌面 innerHTML）各自渲染的，
 * CSS 方案要写两份样式且容易走样；方块字符是纯文本，两端天然逐字一致。
 * 槽位算法：total ≤ 10 → 一格一条（精确）；total > 10 → 归一到 10 格，四舍五入，
 * 保证 done=total 满格、done=0 全空。slots 至少 1，避免 total=0 出现空串。
 */
export declare function progressBar(ws: {
    progress?: TaskProgress | null;
} | null): string | null;
/**
 * 气泡里的完整进度文案：「▰▰▱▱▱  2/5」——方块条在前，数字在后（数字给精确值，方块给比例感）。
 * 无清单 → null。两端都调这一个函数，保证逐字一致。
 */
export declare function progressText(ws: {
    progress?: TaskProgress | null;
} | null): string | null;
