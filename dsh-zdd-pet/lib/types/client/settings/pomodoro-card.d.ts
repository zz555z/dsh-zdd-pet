/**
 * 番茄钟卡（全局）：一整行只放一个「久坐提醒」下拉框。
 * 下拉选项 = 「关闭」+ 若干预设分钟档（shared/pomodoro 的 POMODORO_PRESET_INTERVALS_MIN）：
 *   选「关闭」= 停用；选某个分钟数 = 启用并把间隔设为它。开关与时长收进同一个下拉，卡片更紧凑统一。
 * 若当前配置的间隔不在预设里（用户手改过 config），把它动态补进选项并选中，不丢用户设置。
 * 与其它全局卡同语义：只改本地状态，随「保存」整包写入；宿主半侧到点让桌宠说一句（零 token）。
 * 文案池（texts）不在设置页暴露——保存时透传保留，想自定义请手改 main-config.jsonc。
 * @module dsh-zdd-pet/src/client/settings/pomodoro-card
 */
import type { FunctionComponent } from 'react';
import type { PomodoroParams } from '../../shared/types.ts';
import type { SettingsRuntime } from './runtime.ts';
/** 番茄钟卡的输入。 */
export interface PomodoroCardProps {
    /** 保存中或配置未就绪时禁用全部控件。 */
    busy: boolean;
    /** 当前番茄钟参数。 */
    pomodoro: PomodoroParams;
    /** 改番茄钟参数的若干字段。 */
    onChange: (patch: Partial<PomodoroParams>) => void;
}
/**
 * 造番茄钟卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export declare function makePomodoroCard(rt: SettingsRuntime): FunctionComponent<PomodoroCardProps>;
