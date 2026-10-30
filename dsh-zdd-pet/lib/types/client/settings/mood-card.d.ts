/**
 * 心情 / 亲密度卡（全局）：一个启用开关 + 五个数值。
 *
 * 数值含义：initial 初始心情、touchGain 每次摸上涨几点、decayPerHour 每小时自然衰减几点、
 * low/high 低落与开心的分界（0~100）。文案池、开心/低落动画等高级项不在设置页暴露——
 * 保存时由 existing 透传保留，想自定义请手改 main-config.jsonc。
 * 与其它全局卡同语义：只改本地状态，随「保存」整包写入。
 * @module dsh-zdd-pet/src/client/settings/mood-card
 */
import type { FunctionComponent } from 'react';
import type { MoodParams } from '../../shared/types.ts';
import type { SettingsRuntime } from './runtime.ts';
/** 心情卡的输入。 */
export interface MoodCardProps {
    /** 保存中或配置未就绪时禁用全部控件。 */
    busy: boolean;
    /** 当前心情参数。 */
    mood: MoodParams;
    /** 改心情参数的若干字段。 */
    onChange: (patch: Partial<MoodParams>) => void;
}
/**
 * 造心情卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export declare function makeMoodCard(rt: SettingsRuntime): FunctionComponent<MoodCardProps>;
