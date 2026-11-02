import { type ChatMemoryMessage } from '../chat.ts';
import type { PetImageRef } from '../image-attachment.ts';
import type { MemoryFacts } from './memory-facts.ts';
import type { HostSetup } from './setup.ts';
import type { HostContext } from './context.ts';
/** 对话与记忆的输入：装配期对象与更早的工厂。 */
export type ChatMemoryInput = {
    /** 宿主上下文（apply 收到的那一个）。 */
    ctx: HostContext;
} & Pick<HostSetup, 'configPaths'> & Pick<HostSetup, 'log'> & Pick<HostSetup, 'memeDirsFor'> & Pick<HostSetup, 'state'> & Pick<HostSetup, 'userRoot'> & 
/** 长期记忆（事实）：对话前拼进 system、对话后抽取。可选——独立/测试用法可省略（等同关闭）。 */
Partial<Pick<MemoryFacts, 'readFacts' | 'factsPromptSection' | 'extractFacts'>> & {
    /** 是否启用长期记忆（proactive.longMemory），按该宠物所属条目判。缺省 = 关闭。 */
    longMemoryEnabled?: (conf: Record<string, unknown>) => boolean;
};
/**
 * 创建对话与记忆。
 */
export declare function createChatMemory(deps: ChatMemoryInput): {
    lastWhisperAt: Map<string, number>;
    memoryPath: string;
    readMemory: () => Promise<Record<string, Record<string, {
        messages: ChatMemoryMessage[];
    }>>>;
    memoryRounds: (conf: Record<string, unknown>) => number;
    publishWhisper: (petId: string) => Promise<{
        ok: true;
        text: string;
        image?: string;
    } | {
        ok: false;
        reason: "provider-missing" | "generate-error" | "unknown-pet";
        message?: string;
    }>;
    chatWithPet: (petId: string, text: string, image?: PetImageRef) => Promise<{
        ok: true;
        text: string;
        image?: string;
    } | {
        ok: false;
        reason: "provider-missing" | "generate-error" | "unknown-pet";
        message?: string;
    }>;
    deleteHistory: (petId: string, ts?: readonly number[]) => Promise<{
        ok: true;
        removed: number;
    } | {
        ok: false;
        reason: "unknown-pet";
        message: string;
    }>;
    orphanHistory: () => Promise<import("./memory-orphans.ts").OrphanBucket[]>;
    deleteOrphans: () => Promise<{
        ok: true;
        pets: number;
        messages: number;
    }>;
    getActivePetId: () => string;
    setActivePetId: (id: string) => void;
};
/** 对话与记忆的产出（供下游工厂按需 Pick）。 */
export type ChatMemory = ReturnType<typeof createChatMemory>;
