/**
 * 「等待用户确认」气泡的纯逻辑：文案、停留时长与偏好表情包。
 *
 * 触发场景：
 *   - approval/asked（工具权限审批）
 *   - tool/call name=ask_user_question（模型向用户提问）
 * 表现：桌宠气泡显示对应表情包 + 一句话，并且**一直存在**（hold，不自动收起），直到用户作出选择/
 * 审批结果回来（宿主写入 clear）。不调模型、零 token。
 * @module dsh-zdd-pet/src/host/confirm
 */
/** 需要用户确认的两种场景。 */
export type ConfirmKind = 'approval' | 'question';
/**
 * 确认气泡的「最长停留」：这只是一个安全上限（24 小时），实际由宿主在确认结果回来时主动 clear；
 * 用户一直不确认时，就靠这个上限内的 hold 状态一直显示。
 */
export declare const CONFIRM_HOLD_MS: number;
/** 气泡最大字数（按码点计）：与任务文案同一个克制程度，太长会撑满屏幕。 */
export declare const CONFIRM_TEXT_MAX = 30;
/** 按场景偏好的表情包名（优先从宠物自己的池里挑；池里没有则回退随机一张）。 */
export declare const CONFIRM_PREFERRED_IMAGES: Readonly<Record<ConfirmKind, readonly string[]>>;
/**
 * 生成确认气泡文案。
 *
 * @param kind - 场景：审批 / 提问。
 * @param detail - 可选细节（审批工具名或问题正文）。
 * @returns 一句话；detail 为空时用内置的通用说法。
 */
export declare function confirmText(kind: ConfirmKind, detail?: string): string;
/** 完成气泡的安全停留上限（24 小时）：正常由用户切回界面时 clear，长时间不管也不至于永远挂着。 */
export declare const COMPLETE_HOLD_MS: number;
/** 完成气泡在宿主侧的自动清除时长（ms）：投递后到点自动收起。宿主 node 定时器不受渲染节流，
 *  解决「桌面宠物窗口离焦时 setTimeout 被 Chromium 节流、切回 app 也不消失」的问题。 */
export declare const COMPLETE_AUTO_CLEAR_MS: number;
/** 完成气泡按场景偏好的表情包名（优先从宠物自己的池里挑；池里没有则回退随机一张）。 */
export declare const COMPLETE_PREFERRED_IMAGES: readonly string[];
/** 完成场景：正常完成 / 出错。 */
export type CompleteKind = 'done' | 'error';
/**
 * 生成任务完成气泡文案。
 * @param kind - 正常完成 / 出错。
 * @param detail - 可选细节（如出错信息或任务名）。
 */
export declare function completeText(kind: CompleteKind, detail?: string): string;
