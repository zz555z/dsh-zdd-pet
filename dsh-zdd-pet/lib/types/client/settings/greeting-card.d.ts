/**
 * 启动吉祥话卡（全局）：开关 + 模式下拉（语言池/每次生成）+ 池大小。
 * 与其它全局卡同语义：只改本地状态，随「保存」整包写入。
 *   - 语言池（pool）：首次调模型预生成一批（池大小句）存本地，之后每次启动随机抽一句，省 token。
 *   - 每次生成（live）：每次启动现调模型生成一句。
 * 模型不可用 / 池空时用内置兜底吉祥话，保证一定开口。
 * @module dsh-zdd-pet/src/client/settings/greeting-card
 */
import type { FunctionComponent } from 'react';
import type { GreetingParams } from '../../shared/types.ts';
import type { SettingsRuntime } from './runtime.ts';
/** 启动吉祥话卡的输入。 */
export interface GreetingCardProps {
    /** 保存中或配置未就绪时禁用全部控件。 */
    busy: boolean;
    /** 当前配置。 */
    greeting: GreetingParams;
    /** 改若干字段。 */
    onChange: (patch: Partial<GreetingParams>) => void;
}
/**
 * 造启动吉祥话卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export declare function makeGreetingCard(rt: SettingsRuntime): FunctionComponent<GreetingCardProps>;
