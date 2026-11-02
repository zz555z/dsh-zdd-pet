/**
 * 长期记忆（事实）：从对话里抽取「可长期记住的事实」并持久化，下次对话拼进 system prompt。
 *
 * 与 memory.json（逐轮原文，只做上下文窗口）分工：这里存的是**蒸馏后的事实**（你是谁、在做
 * 什么项目、偏好、常提的人/事），条目少而精，长期有效，不随轮数滚出窗口。
 *
 * 存储：userRoot/facts.json，结构 { <petId>: MemoryFact[] }。每只宠物独立，上限 MEMORY_FACT_MAX 条
 * （超出按最旧淘汰）。抽取调模型，失败静默（不影响对话本身）。
 * @module dsh-zdd-pet/src/host/plugin/memory-facts
 */
import { type MemoryFact } from '../../shared/proactive.ts';
import type { ModelRef } from '../model-selection.ts';
import type { FileLogger } from '../log-file.ts';
/** 长期记忆的输入。 */
export interface MemoryFactsInput {
    /** 数据根。 */
    userRoot: string;
    /** 宿主上下文（注入 llm / agentDefaultModel），抽取时用。 */
    ctx: {
        agentDefaultModel: {
            currentSelection(): {
                provider: string;
                model: string;
            };
        };
        llm?: unknown;
    };
    /** 日志。 */
    log: FileLogger;
}
/** 解析模型返回的抽取文本：按行拆分、去编号/空行，能识别「无」→ []。 */
export declare function parseFacts(text: string): string[];
/** 合并新事实到旧列表：去重（完全相同或包含关系视为重复）、追加、截断到上限。 */
/** 合并结果：合并后的列表 + 本次实际新增（去重后、未被上限淘汰前）的条数。 */
export interface MergeResult {
    facts: MemoryFact[];
    added: number;
}
/** 合并新事实到旧列表：去重（完全相同或包含关系视为重复）、追加、截断到上限。 */
export declare function mergeFacts(old: readonly MemoryFact[], fresh: readonly string[], now: number): MergeResult;
/**
 * 长期记忆的读写面。
 */
export declare function createMemoryFacts(deps: MemoryFactsInput): {
    readFacts: (petId: string) => Promise<MemoryFact[]>;
    factsPromptSection: (facts: readonly MemoryFact[]) => string;
    extractFacts: (petId: string, system: string, userText: string, reply: string, preferred?: ModelRef) => Promise<number>;
    path: string;
};
export type MemoryFacts = ReturnType<typeof createMemoryFacts>;
