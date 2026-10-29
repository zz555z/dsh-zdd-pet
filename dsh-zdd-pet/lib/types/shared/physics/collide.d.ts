/** 一只参与碰撞的宠物：位置（包围盒左上角，px）+ 速度（px/s）+ 宽（px，质量 ∝ size²）。 */
export interface PetCollider {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
}
/** 身体包围盒（HIT_BOX 命中框比例换算到视口像素）：碰撞相交检测的几何。
 *  box = 宠物包围盒左上角（浏览器 root 的 left/top、桌面窗口位置）；
 *  bottomPad = 舞台脚底垫高（stage 被 translateY 下移的量）。 */
export declare const bodyPixelBox: (o: {
    x: number;
    y: number;
    size: number;
    bottomPad: number;
}) => {
    left: number;
    top: number;
    right: number;
    bottom: number;
};
/** 两矩形是否相交（碰撞检测）。 */
export declare const rectsOverlap: (a: {
    left: number;
    top: number;
    right: number;
    bottom: number;
}, b: {
    left: number;
    top: number;
    right: number;
    bottom: number;
}) => boolean;
/** 飞行中的宠物撞到另一只：近乎弹性碰撞（动量守恒 + 恢复系数 0.995），质量 ∝ size²。
 *  法向 = 两包围盒中心连线，法向速度按一维动量公式重分配，切向分量各自保留（无切向摩擦）。
 *  返回 null = 中心重合定不出法向，或两者正在分离（避免重叠帧反复弹跳抖动）。 */
export declare const collidePet: (fly: PetCollider, hit: PetCollider) => {
    fvx: number;
    fvy: number;
    hvx: number;
    hvy: number;
} | null;
/** 共享碰撞站场的槽位（每只宠物注册一个；浏览器半侧 PetMulti 与桌面端的碰撞 broker 共用）。 */
export interface PetCollisionSlot {
    /** 宠物宽（px，质量 ∝ size²） */
    size: number;
    /** 舞台脚底垫高（bodyPixelBox 需要） */
    bottomPad: number;
    /** 当前包围盒左上角（px）；null = 未挂载或无位置 */
    getBox: () => {
        x: number;
        y: number;
    } | null;
    /** 当前速度（px/s）；非飞行中为 0 */
    getVel: () => {
        vx: number;
        vy: number;
    };
    /** 被撞回调：用新初速从当前落点重新抛掷 */
    onHit: (vx: number, vy: number) => void;
}
