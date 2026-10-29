import type { HostSetup } from './plugin/setup.ts';
/** 启动吉祥话所需依赖。 */
export type GreetingDeps = {
    ctx: {
        agentDefaultModel: {
            currentSelection(): {
                provider: string;
                model: string;
            };
        };
        llm?: unknown;
    };
} & Pick<HostSetup, 'configPaths'> & Pick<HostSetup, 'state'> & Pick<HostSetup, 'log'> & Pick<HostSetup, 'memeDirsFor'> & Pick<HostSetup, 'userRoot'>;
/**
 * 每次启动问候：按配置模式（pool 抽一句 / live 现生成）给每只宠物投一句吉祥话。
 *
 * @param deps - 装配期依赖。
 * @returns 是否启用了问候并投递（未启用 / 无宠物 → false）。
 */
export declare function maybeGreeting(deps: GreetingDeps): Promise<boolean>;
