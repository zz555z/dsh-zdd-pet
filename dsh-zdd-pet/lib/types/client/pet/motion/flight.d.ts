/**
 * 抛掷飞行：重力、边缘反弹与落地摩擦，飞行中只改 DOM 位置，落定后才提交 normalized 中心。
 * 不负责起点与初速（拖拽松手、抛掷指令与宠物互撞各自决定），也不负责落地挤压的动画本身。
 * 依赖注入的取值函数与物理参数；rAF 句柄与飞行状态由本模块持有。
 * 不变量：每帧先积分、再处理互撞、最后写 DOM 与提交位置；落定那一帧才调 commitFinal。
 * @module dsh-zdd-pet/src/client/pet/motion/flight
 */
import { type PetCollisionSlot } from '../../../shared/physics.ts';
import type { BoxPoint, Center, Viewport } from './geometry.ts';
import type { PhysicsParams } from '../../../shared/types.ts';
/** 飞行需要的当帧几何（px）。 */
export interface FlightMetrics {
    /** 宠物宽度。 */
    size: number;
    /** 盒半宽。 */
    halfW: number;
    /** 盒半高。 */
    halfH: number;
    /** 身体相对视频盒左右各留的透明边。 */
    sideAllow: number;
    /** 舞台脚底垫高：互撞用的身体框按它上移。 */
    bottomPad: number;
}
/** 飞行驱动的依赖：全部用取值函数，避免捕获渲染期的快照。 */
export interface FlightDeps {
    /** 宠物根节点；`null` 表示还没挂载。 */
    root(): HTMLDivElement | null;
    /** 当帧几何。 */
    metrics(): FlightMetrics;
    /** 当前视口尺寸。 */
    viewport(): Viewport;
    /** 该宠物的物理参数。 */
    physics(): PhysicsParams;
    /** 宠物间碰撞站场。 */
    arena(): {
        slots: Record<string, PetCollisionSlot>;
    };
    /** 本宠物 id：碰撞时用来跳过自己。 */
    petId: string;
    /** 当前包围盒位置。 */
    box(): BoxPoint | null;
    /** 写回包围盒位置（每帧调用）。 */
    setBox(box: BoxPoint): void;
    /** 每帧写回归一化中心：刷新或重渲染时按它重排位置，不能用 React 状态（会慢一拍）。 */
    commitLive(center: Center): void;
    /** 落定后提交归一化中心，交给 React 收尾。 */
    commitFinal(center: Center): void;
    /** 落地挤压：入参是本帧落地前的竖直速度（冲击速度）。 */
    onLanding(impactVy: number): void;
}
/** 飞行驱动：一个宠物一个实例。 */
export interface Flight {
    /**
     * 从给定左上角与初速起飞。
     *
     * @param px - 包围盒左边缘（px）。
     * @param py - 包围盒上边缘（px）。
     * @param vx - 水平初速（px/s）。
     * @param vy - 竖直初速（px/s）。
     */
    start(px: number, py: number, vx: number, vy: number): void;
    /** 停飞：取消在跑的帧并清空飞行状态。 */
    stop(): void;
    /** 是否在飞。 */
    isFlying(): boolean;
    /** 最近一帧的速度；没在飞时为 0。 */
    velocity(): {
        vx: number;
        vy: number;
    };
}
/**
 * 造飞行驱动。
 *
 * @param deps - 取几何、写位置与落地回调。
 * @returns 可反复调用的驱动。
 */
export declare function createFlight(deps: FlightDeps): Flight;
