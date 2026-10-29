/**
 * 模型选择器浮层的定位计算：把触发器的实测矩形与视口尺寸换算成浮层的 fixed 坐标。
 * 下方放不下且上方更宽裕时翻到上方，左右钳制在视口内，并给出高度上限——浮层自身不进文档流。
 * 纯函数，不读 `window`：矩形与视口由调用方传入，便于单测与将来的视口外定位。
 * @module dsh-zdd-pet/src/client/settings/picker/model-picker-placement
 */
/** 触发器的实测矩形，语义同 `DOMRect` 的这几个字段。 */
export interface AnchorRect {
    left: number;
    top: number;
    bottom: number;
    width: number;
}
/** 视口尺寸，通常直接取 `window.innerWidth` / `innerHeight`。 */
export interface Viewport {
    width: number;
    height: number;
}
/** 浮层的 fixed 定位与尺寸；`top` 与 `bottom` 只有一个有值。 */
export interface PanelPosition {
    left: number;
    top?: number;
    bottom?: number;
    width: number;
    maxHeight: number;
}
/**
 * 算出浮层该贴在哪。
 *
 * @param anchor - 触发器的实测矩形。
 * @param viewport - 视口尺寸。
 * @returns 浮层定位；上方空间更宽裕时给出 `bottom`，否则给出 `top`。
 */
export declare function computePanelPlacement(anchor: AnchorRect, viewport: Viewport): PanelPosition;
