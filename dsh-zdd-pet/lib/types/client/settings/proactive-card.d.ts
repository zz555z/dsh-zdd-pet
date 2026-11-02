/**
 * 主动关心 + 长期记忆卡（全局）：开关 + 冷却/久未搭理/深夜时段 + 长期记忆开关。
 *
 * 文案池不在设置页暴露——想改主动关心的措辞就得改代码（prompt 固定）。数值都在这里调。
 * @module dsh-zdd-pet/src/client/settings/proactive-card
 */
import type { FunctionComponent } from 'react';
import type { SettingsRuntime } from './runtime.ts';
import type { ProactiveParams } from '../../shared/proactive.ts';
/** 卡的输入。 */
export interface ProactiveCardProps {
    /** 保存中或配置未就绪时禁用全部控件。 */
    busy: boolean;
    /** 当前参数。 */
    proactive: ProactiveParams;
    /** 改参数字段。 */
    onChange: (patch: Partial<ProactiveParams>) => void;
}
/**
 * 造主动关心卡。
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export declare function makeProactiveCard(rt: SettingsRuntime): FunctionComponent<ProactiveCardProps>;
