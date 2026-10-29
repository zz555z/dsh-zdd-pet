/**
 * 气泡展示时长策略（两端共用）。
 *
 * 这些数值同时决定桌面 Electron 渲染端与浏览器 overlay 的气泡停留时间，
 * 集中在这里，避免两端各写一份后调参漏掉一端。
 * @module dsh-zdd-pet/src/shared/timings
 */
/** 余额 / 碎碎念 / 普通说一句的默认气泡时长（ms）。 */
export declare const BUBBLE_DURATION_MS: number;
/** 工作状态（非终态）气泡单次展示时长（ms）：到时自动收起，新一轮/任务详情变化再点亮。 */
export declare const WORK_BUBBLE_MS: number;
/** 说话气泡按时长展示时用的下界（ms）。 */
export declare const SAY_BUBBLE_MIN_MS: number;
/** 说话气泡按时长展示时用的上界（ms）：长回复也不无限停留。 */
export declare const SAY_BUBBLE_MAX_MS: number;
/** 按文本长度计算说话气泡时长的基础值（ms）。 */
export declare const SAY_BUBBLE_BASE_MS: number;
/** 按文本长度计算说话气泡时，每个字符增加的时长（ms）。 */
export declare const SAY_BUBBLE_PER_CHAR_MS = 250;
/**
 * 按文本长度给出说话气泡的展示时长：3s + 250ms/字，夹在 10s~60s。
 * 按码点计长度（emoji 算 1 个），空文本按最短 10s。
 */
export declare function sayBubbleDurationMs(text: string): number;
