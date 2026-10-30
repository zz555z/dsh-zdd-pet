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
export const CONFIRM_HOLD_MS = 24 * 60 * 60 * 1000;

/** 气泡最大字数（按码点计）：与任务文案同一个克制程度，太长会撑满屏幕。 */
export const CONFIRM_TEXT_MAX = 30;

/** 按场景偏好的表情包名（优先从宠物自己的池里挑；池里没有则回退随机一张）。 */
export const CONFIRM_PREFERRED_IMAGES: Readonly<Record<ConfirmKind, readonly string[]>> = {
  approval: ['压力一只大肥鱼', '哦鲸鲸', '可爱', '厉害了我的鲸'],
  question: ['哦鲸鲸', '大师这个区是什么意思', '可爱', '压力一只大肥鱼'],
};

/** 按码点截断并补省略号。 */
function clip(text: string, max: number): string {
  const points = Array.from(text.trim());
  return points.length > max ? points.slice(0, max).join('') + '…' : points.join('');
}

/**
 * 生成确认气泡文案。
 *
 * @param kind - 场景：审批 / 提问。
 * @param detail - 可选细节（审批工具名或问题正文）。
 * @returns 一句话；detail 为空时用内置的通用说法。
 */
export function confirmText(kind: ConfirmKind, detail?: string): string {
  const d = String(detail ?? '').trim();
  if (kind === 'approval') return d ? clip('有个操作需要你确认：' + d, CONFIRM_TEXT_MAX) : '有个操作需要你确认一下～';
  return d ? clip('有个问题想问你：' + d, CONFIRM_TEXT_MAX) : '有个问题想问你，等你选一下～';
}
