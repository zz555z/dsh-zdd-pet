/**
 * 主动关心：宠物在合适时机自己冒一句关心话（久未搭理 / 深夜还在忙 / 刚做完一段专注）。
 *
 * 纯判据在 shared/proactive.ts（decideCare）；本模块负责「信号收集 + 定时检查 + 生成投递 + 冷却去重」。
 * 生成走 generateWhisper（自定义 prompt），结果写 pets.<id>.say——与碎碎念同一条展示链路。
 * 冷却/上次交互用内存态（重启重置，键为 petId）；没交互就是没交互，宁可重启后多关心一次也不误报。
 * 零额外快照叶子：判据所需信号都在本进程内存里。
 * @module dsh-zdd-pet/src/host/plugin/proactive
 */
import type { ModelRef } from '../model-selection.ts';
import type { HostSetup } from './setup.ts';
import type { HostContext } from './context.ts';
/** 主动关心的输入。 */
export type ProactiveInput = {
    ctx: HostContext;
} & Pick<HostSetup, 'configPaths' | 'state' | 'log' | 'memeDirsFor'> & {
    /** 某条目配置的模型选择（whisperModel）。 */
    configuredModel: (conf: Record<string, unknown>, key: 'whisperModel' | 'chatModel') => ModelRef | undefined;
    /** 现在是否「最近在工作活动」（读工作状态快照的最近变化时刻；用于深夜提醒）。 */
    recentlyActive: () => boolean;
};
/**
 * 创建主动关心循环。
 *
 * @returns 记录交互/专注信号的几个入口 + 启动循环的函数。
 */
export declare function createProactive(deps: ProactiveInput): {
    start: () => void;
    touchInteraction: (petId: string) => void;
    markFocusComplete: (petId: string) => void;
};
export type Proactive = ReturnType<typeof createProactive>;
