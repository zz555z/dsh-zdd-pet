/**
 * 任务完成提示的配置形状、默认值与校验（纯逻辑，浏览器与桌面端共用）。
 *
 * 一轮任务完成 / 出错时，桌宠弹一条带表情的气泡；本配置决定是否启用、以及是否自动收起：
 *   - holdUntilFocus = true（默认）：鼠标移到宠物身上即收起，另有约 20 秒兜底自动消失；
 *   - holdUntilFocus = false：不自动收，一直挂着直到下一次说话/手动清除把它覆盖。
 * （字段名沿用 holdUntilFocus 只为配置兼容；实际语义已是「hover 即收 + 定时兜底」。）
 * @module dsh-zdd-pet/src/shared/completion
 */
/** config.jsonc 的 completion 段。 */
export interface CompletionParams {
    /** 是否启用任务完成提示。关闭 = 完成时不挂气泡（仍会有既有的彩蛋/系统通知）。 */
    enabled: boolean;
    /** 是否「鼠标移过去即收起（+20s 定时兜底）」。true（默认）= 自动收；false = 一直挂着。 */
    holdUntilFocus: boolean;
}
/** 内置默认（与 assets/config.jsonc 的 completion 段保持一致）。 */
export declare const DEFAULT_COMPLETION: CompletionParams;
/** 解析 completion 段；缺失/非法 → 默认值。 */
export declare function readCompletionParams(raw: unknown): CompletionParams;
/** completion 段校验：enabled / holdUntilFocus 若出现必须是布尔。 */
export declare function completionValid(value: unknown): boolean;
