/**
 * 移动几何与角落定位：纯计算，无 DOM / ref，可独立单测。
 * 移动规划归一化为视口比例，px 换算由调用方完成；角落定位返回宠物根节点左上角的像素坐标。
 * 不负责 rAF 驱动与样式写入，那些在各端的薄壳里。
 * 依赖共享层的选择函数与显示器几何，保证两端算出同一条路线。
 * @module dsh-zdd-pet/src/shared/motion
 */
import { randomBetween } from './pickers.ts';
import { rectAtPoint } from './displays.ts';
import type { Corner, Rect } from './types.ts';

/** 一次移动的几何参数（比例坐标）。 */
export interface MovePlan {
  startRatio: number;
  startYRatio: number;
  targetRatio: number;
  totalRatio: number;
}

/** 计算一次移动的起点/终点比例坐标；目标越出边界（含边距）时返回 null。
 *  sideAllow = 左右透明边余量：边界按身体贴边而不是按整个视频盒贴边，宠物能走到屏幕边缘、身体不越界。
 *  areas 传入时（桌面多显示器）改判工作区并集：缝隙两侧都有屏即可骑缝走过，外接矩形的空洞走不进去；
 *  不传时按 W/H 单矩形判定，浏览器半侧行为不变。 */
export const planMove = (o: {
  cx: number;
  cy: number;
  W: number;
  H: number;
  dir: 1 | -1;
  minDist: number;
  maxDist: number;
  margin: number;
  halfW: number;
  /** 可选：身体相对视频盒左/右各留多少像素（默认 0 = 按视频盒贴边） */
  sideAllow?: number;
  /** 可选：显示器工作区列表（与 cx/cy 同坐标系）。给了就按并集判定落点可达性 */
  areas?: Rect[];
}): MovePlan | null => {
  const side = o.sideAllow ?? 0;
  const distance = randomBetween(o.minDist, o.maxDist);
  const target = o.cx + o.dir * distance;
  if (o.areas && o.areas.length > 0) {
    // 身体左右缘各外扩 margin 后都得落在某块屏上（可以分属不同屏 = 允许骑缝行走）
    const bodyHalf = o.halfW - side;
    if (!rectAtPoint(o.areas, target - bodyHalf - o.margin, o.cy)) return null;
    if (!rectAtPoint(o.areas, target + bodyHalf + o.margin, o.cy)) return null;
  } else {
    // margin 语义 =「身体到屏幕边缘的安全距」：盒中心可到 margin + halfW - side（身体左缘 = margin）
    const leftBound = o.margin + o.halfW - side;
    const rightBound = o.W - o.margin - o.halfW + side;
    if (target < leftBound || target > rightBound) return null;
  }
  return {
    startRatio: o.cx / o.W,
    startYRatio: o.cy / o.H,
    targetRatio: target / o.W,
    totalRatio: Math.abs(target - o.cx) / o.W,
  };
};

/**
 * 角落 + 边距 → 宠物根节点左上角像素坐标，与浏览器半侧 overlay 的 CSS 角落语义一致。
 * area 传入时角落取那块屏而不是视口外接矩形：不规则布局下外接矩形的角落可能不属于任何屏，
 * 配了该角落的宠物会开机即隐身，所以桌面端必须传主屏工作区。不传时按 W/H，overlay 行为不变。
 *
 * sideAllow（宠物身体在盒子里的左右透明留白，通常 = HIT_BOX.x0/640×size）传入后，水平方向按
 * **身体边缘**贴边而不是盒子边缘：右/左角的 marginX 变成「身体到屏边的距离」。否则盒子宽 = size，
 * 身体居中，marginX 加在盒子右缘，身体实际离屏还多出一段透明留白（size 越大越明显）。
 */
export const anchorPixel = (o: {
  corner: Corner;
  marginX: number;
  marginY: number;
  size: number;
  W: number;
  H: number;
  /** 可选：角落所属的工作区矩形（与调用方同坐标系）；缺省用 {0,0,W,H} */
  area?: Rect;
  /** 可选：身体相对盒子左右的内缩留白（px）。传入则水平方向按身体贴边；缺省 0 = 按盒子贴边（旧行为） */
  sideAllow?: number;
}): { x: number; y: number } => {
  const height = (o.size * 9) / 16;
  const a = o.area ?? { x: 0, y: 0, width: o.W, height: o.H };
  // 身体左右内缩量：右角要让身体离屏 = marginX，则盒子左边要多往右推 sideAllow；
  // 左角要让身体离屏 = marginX，则盒子左边要多往左退 sideAllow。
  const side = o.sideAllow ?? 0;
  const left = a.x + o.marginX - side;
  const top = a.y + o.marginY;
  const right = a.x + a.width - o.size - o.marginX + side;
  const bottom = a.y + a.height - height - o.marginY;
  switch (o.corner) {
    case 'top-left':
      return { x: left, y: top };
    case 'top-right':
      return { x: right, y: top };
    case 'bottom-left':
      return { x: left, y: bottom };
    case 'bottom-right':
      return { x: right, y: bottom };
  }
};
