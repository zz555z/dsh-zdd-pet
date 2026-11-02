import type { Extras } from './plugin/extras.ts';
import type { HostSetup } from './plugin/setup.ts';
/** 菜单/路由可触发的动作。 */
export type PomodoroAction = 'start' | 'pause' | 'resume' | 'stop' | 'reset' | 'skip' | 'status';
/** 引擎对外能力。 */
export interface PomodoroEngine {
    /** 执行一个动作；失败给出原因（路由回 ok:false）。 */
    control(action: PomodoroAction, petId: string): {
        ok: boolean;
        reason?: string;
        message?: string;
    };
    /** 停掉定时器（插件卸载）。 */
    dispose(): void;
}
/** 引擎依赖：配置 / 状态 / 日志 / 表情包投递。 */
export type PomodoroEngineInput = Pick<HostSetup, 'configPaths' | 'state' | 'log' | 'memeDirsFor'> & Pick<Extras, 'deliverCue' | 'pickPetMeme'> & {
    /** 一段专注自然走完（非 skip）时回调：供主动关心「刚做完长专注」判据使用。 */
    onFocusComplete?: (petId: string) => void;
};
/**
 * 创建番茄钟引擎。
 *
 * @param deps - 宿主能力。
 * @returns 动作入口与卸载清理。
 */
export declare function createPomodoroEngine(deps: PomodoroEngineInput): PomodoroEngine;
