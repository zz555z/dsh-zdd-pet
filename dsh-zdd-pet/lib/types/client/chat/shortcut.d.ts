/**
 * 「打开桌宠对话」的快捷键：注册进 DSH 的快捷键服务。
 *
 * 注册后自动出现在 设置 → 通用 → 快捷键（可改绑、有冲突提示），
 * 侧栏 guide 卡片通过 `commandId` 显示键帽。服务缺失（旧宿主）只告警，不影响面板本身。
 * @module dsh-zdd-pet/src/client/chat/shortcut
 */
/** 命令 id：guide 卡片的 `commandId` 与注册都用它。 */
export declare const PET_CHAT_COMMAND_ID = "pet-chat.open";
/** 注册快捷键需要的上下文。 */
export interface ShortcutHost {
    /** Cordis 的软取服务：拿不到返回 undefined。 */
    get?(name: string): unknown;
}
/**
 * 注册对话快捷键。
 *
 * @param ctx - 客户端上下文（只用到软取）。
 * @param open - 触发时要执行的动作（打开对话标签）。
 * @returns `registered` 表示命令是否真的登记成功；`dispose` 用于注销（失败时是空函数）。
 *   失败时调用方不能再把 `commandId` 交给侧栏——指向不存在的命令会让侧栏注册抛错。
 */
export declare function registerPetChatShortcut(ctx: ShortcutHost, open: () => void): {
    registered: boolean;
    dispose: () => void;
};
