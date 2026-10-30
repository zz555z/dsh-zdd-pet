/**
 * 工作状态联动（host 半侧，自包含，不 import src/shared）。
 *
 * 负责监听 DSH 的 session/event，把会话事件压缩成「当前活动工作状态」并按会话聚合，
 * 由调用方写进 sections.workStatus，两端轮询 /state 后按 counter 变化渲染。
 * 只做聚合与去重：状态无变化不产生新输出（签名比对防刷屏），不调用任何模型。
 * 依赖会话事件与调用方维护的 turn 上下文；不负责档位文案与动画，那些在两端消费侧。
 * 始终成立：档位顺序与 animations.events.workStatus 数组索引严格一致，不在中间插入。
 * 契约见 API.md 与 openapi.yaml。
 *
 * @module dsh-zdd-pet/src/host/work-status
 */
/** 工作状态档位（数组索引 = events.workStatus 档位；顺序与 shared/work-status.ts 一致）。 */
export declare const HOST_WORK_STATUS_STATES: readonly ["thinking", "working", "result", "waiting", "success", "error"];
export type HostWorkStatusState = (typeof HOST_WORK_STATUS_STATES)[number];
/** update_goal 工具名：目标工具，action=complete/blocked = 本轮是该目标任务的收尾轮。 */
export declare const GOAL_UPDATE_TOOL = "update_goal";
/** 本 turn 的 turn 级标志（goal 续跑轮判定；不参与展示，由调用方维护）。 */
export interface WorkStatusTurnContext {
    /** 本轮是否为自动目标续跑轮（user/message source.kind==='goal' 时置位，turn/start 清零）。 */
    goalRound?: boolean;
    /** 本轮是否调用过 update_goal 收尾（'complete' | 'blocked'；undefined/null = 未收尾）。 */
    closing?: 'complete' | 'blocked' | null;
}
/** 解析 update_goal 的 arguments（原始 JSON 字符串）→ 收尾动作；解析失败 / 非收尾动作返回 null。 */
export declare function goalUpdateAction(args: string): 'complete' | 'blocked' | null;
/**
 * turn/end completed 的终局判定：非 goal 轮直接 success；自动续跑轮的中间轮 → result（本轮完成
 * 不等于整个任务完成，不庆祝）；收尾轮 complete → success，blocked → error（目标被阻塞结束，
 * 诚实地表沮丧而非庆祝）。
 */
export declare function completedState(turn: WorkStatusTurnContext | undefined): HostWorkStatusState;
/** 从会话事件压缩出工作状态；无变化 / 不关心返回 null。
 *  turn 为当前回合上下文（goal 续跑轮判定），只影响 turn/end completed 的终局语义。 */
export declare function reduceWorkStatus(event: {
    type?: string;
    data?: Record<string, unknown> & {
        reason?: {
            kind?: string;
        };
    };
}, turn?: WorkStatusTurnContext): HostWorkStatusState | null;
/**
 * 任务详情文案长度上限（按码点计，超出截断加省略号）：气泡最大宽度只有 0.5×宠物宽
 * （默认 size 462 时约 231px，字号 21px 约一行 11 个汉字），而清单原文动辄几十字，不截断会把
 * 气泡撑成好几行、盖住宠物。截断放在 host 这一处，两端天然一致。
 */
export declare const TASK_TEXT_MAX = 40;
/**
 * 一步任务文案 → 展示文案（trim + 按码点截断加省略号）；空 → null。
 * 截断规则只此一份：任务详情与清单摘要共用，浏览器与桌面两端天然一致。
 */
export declare function taskStepText(content: unknown): string | null;
/** 清单摘要：done 已勾选 / total 总条数（两者都有才算有清单，否则 null）。 */
export interface TaskProgress {
    done: number;
    total: number;
}
/** todo/write 清单压缩出的展示数据：任务详情文案 + 清单进度。 */
export interface TodoView {
    task: string | null;
    progress: TaskProgress | null;
}
/**
 * todo/write 清单 → { task, progress }；两者都是 null = 无清单（或清单已全部完成）。
 *
 * task 取**最后一个** in_progress（最近开始的那一步），而不是第一个：agent 常把新步骤标成
 * in_progress 却忘了把上一步标 completed，取第一个就会永远停在最早那步。没有进行中的项时
 * 回落到第一个 pending（= 下一步要做的）。
 *
 * progress 是「气泡显示具体进度」的量化口径：done = status==='completed' 的条数、total = 全部条数。
 * 与 state 同生共死——清清单 / 清单跑完都归 null（气泡回落到档位文案），不会残留一个 "5/5" 挂在
 * 之后的无关会话上。in_progress 不计入 done（它还没勾完），故「2/5 + 正在做第 3 项」读得通。
 */
export declare function todoViewFromTodo(event: {
    data?: {
        todos?: Array<{
            status?: string;
            content?: string;
        }>;
    };
}): TodoView;
/** 工作状态快照（/work-status 端点响应体）：state 为主状态；task/progress 为 todo 详情（可 null）。 */
export interface WorkStatusSnapshot {
    state: HostWorkStatusState | null;
    task: string | null;
    progress: TaskProgress | null;
    ts: number;
}
/**
 * 任务详情是否「正在展示」：有清单进度或有任务文案。
 * 两端气泡槽位用它判定「有任务」——有任务时碎碎念/余额一律让位（进度气泡优先），
 * 只有没任务时它们才能占用气泡。判据只看快照本身，不看档位。
 */
export declare function hasTask(ws: {
    task?: string | null;
    progress?: TaskProgress | null;
} | null): boolean;
/** 每会话聚合条目。 */
export interface SessionWorkEntry {
    /** 该会话当前档位。 */
    state: HostWorkStatusState;
    /** 该会话最近事件的序号，同档位时按它取最近。 */
    seq: number;
    /** 任务详情文案；null = 该会话没有清单。 */
    task: string | null;
    /** 清单进度；null = 该会话没有清单。 */
    progress: TaskProgress | null;
}
/** 展示优先级：waiting > error > working > thinking > result > success。
 *  result 高于 success：任何会话的进行中过渡态都不被别处已完成态压过，防中途庆祝；同档按最近更新优先。 */
export declare const WORK_STATUS_PRIORITY: Record<HostWorkStatusState, number>;
/** 展示用条目：所有会话里优先级最高者（同优先级取 seq 更大者）；无会话返回 undefined。 */
export declare function pickDisplayed(entries: Iterable<SessionWorkEntry>): SessionWorkEntry | undefined;
/**
 * 工作状态聚合（纯逻辑，可单测）：按会话维护 state / task / progress，对外只暴露一个展示快照。
 *
 * task/progress 必须挂在会话条目上：挂成全局单值就没有独立于 todo/write 的生命周期，写过一次会跟着
 * 此后所有会话活动一直显示，连配置里的 workStatusTexts 档位文案也被永久屏蔽。挂进条目后文案与它的
 * 会话同生共死：条目被清、新一轮 turn/start、清单里再无进行中项，文案都会消失。展示时
 * state / task / progress 取自同一个 best 会话，因此不会出现 A 会话的状态配 B 会话的文案。
 */
export declare class WorkStatusStore {
    private readonly sessions;
    private readonly snap;
    constructor();
    /** 该会话当前是否有活动条目（决定 todo/write 是否还值得更新它的文案）。 */
    has(sessionId: string): boolean;
    /** 该会话当前档位（无条目 / 已清返回 undefined）。 */
    stateOf(sessionId: string): HostWorkStatusState | undefined;
    /** 该会话当前任务详情（无条目返回 null）。 */
    taskOf(sessionId: string): string | null;
    /** 该会话当前清单进度（无条目返回 null）。 */
    progressOf(sessionId: string): TaskProgress | null;
    /** 写会话状态（保留该会话已有的 task/progress）；同状态且 seq 不更新则不写并返回 false（防刷屏）。 */
    setState(sessionId: string, state: HostWorkStatusState, seq?: number): boolean;
    /**
     * 写该会话的任务详情 + 清单进度（null = 清空）；会话无活动条目 → 不动（它不会被展示）。
     * 两者同一次写入：它们出自同一条 todo/write，分两次写会让 refresh 在中途看见
     * 「新 task 配旧 progress」的混合态，并因此多发一拍 ts。
     */
    setTask(sessionId: string, task: string | null, progress?: TaskProgress | null): boolean;
    /**
     * 写「当前动作」文案，默认**保留已有清单进度**：工具调用只改变正在做什么，不代表清单进度清零。
     *
     * @param sessionId - 会话标识。
     * @param task - 新的动作文案。
     * @param progress - 显式传 undefined = 保留原进度；传 null = 清空进度；传值 = 一并更新。
     */
    setAction(sessionId: string, task: string | null, progress?: TaskProgress | null): boolean;
    /** 只更新清单进度、保住当前动作文案：工具执行途中收到 todo/write 时用，避免进度条滞后。 */
    setProgress(sessionId: string, progress: TaskProgress | null): boolean;
    /** 清掉某会话（回合结束 / 终态过期）：它的 task/progress 一并消失，不会残留到后续活动里。 */
    clear(sessionId: string): boolean;
    /** 展示快照（对象引用稳定，供 /work-status 直接序列化）。 */
    snapshot(): WorkStatusSnapshot;
    /** 重算展示：state / task / progress 任一变化才更新 ts（轮询侧据此触发，两端都靠它刷新）。 */
    private refresh;
}
