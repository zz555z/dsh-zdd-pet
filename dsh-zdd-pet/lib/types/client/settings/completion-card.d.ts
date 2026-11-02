/**
 * 任务完成常驻提示卡（全局）：启用开关 + 是否「切回界面自动收起」。
 *
 * 文案与表情包不在设置页暴露（在 host/confirm.ts 里固定）；这里只管两个布尔行为。
 * @module dsh-zdd-pet/src/client/settings/completion-card
 */
import type { FunctionComponent } from 'react';
import type { SettingsRuntime } from './runtime.ts';
import type { CompletionParams } from '../../shared/completion.ts';
/** 卡的输入。 */
export interface CompletionCardProps {
    /** 保存中或配置未就绪时禁用全部控件。 */
    busy: boolean;
    /** 当前参数。 */
    completion: CompletionParams;
    /** 改参数字段。 */
    onChange: (patch: Partial<CompletionParams>) => void;
}
/**
 * 造任务完成常驻提示卡。
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export declare function makeCompletionCard(rt: SettingsRuntime): FunctionComponent<CompletionCardProps>;
