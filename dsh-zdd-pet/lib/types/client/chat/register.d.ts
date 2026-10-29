import { type ChatPanelRuntime } from './panel.ts';
/** 注册对话标签需要的最小上下文。 */
export interface PetChatTabHost {
    /** Cordis 的软取服务：拿不到返回 undefined。 */
    get?(name: string): unknown;
    /** 插槽注册表。 */
    slots: {
        /** 等到某个插槽被声明后再执行注册（与 shell.overlay 同一套等待方式）。 */
        inject(name: string, generator: () => Generator<unknown, void, unknown>): void;
        /**
         * 注册一个挂载点。
         *
         * keyed 插槽按 `key` 分派（值即标签类型定义的 `id`）；写成 `id` 会让侧栏查不到正文，
         * 落到「这类内容还没有可用的查看方式」的兜底文案。
         */
        register(registration: {
            name: string;
            key: string;
            order: number;
        }, component: () => unknown): () => void;
    };
}
/**
 * 注册对话标签（标签类型 + 正文插槽 + 样式）。
 *
 * @param ctx - 客户端上下文。
 * @param rt - 注入的 react 能力。
 * @returns 注销标签类型并释放样式的函数；正文插槽交给 slots.inject 的作用域随插件卸载。
 */
export declare function registerPetChatTab(ctx: PetChatTabHost, rt: ChatPanelRuntime): () => void;
