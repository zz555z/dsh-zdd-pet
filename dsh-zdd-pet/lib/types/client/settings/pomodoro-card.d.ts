/**
 * 番茄钟卡（全局）：专注 / 短休息 / 长休息 / 轮数 / 两个自动开关。
 *
 * 右键菜单的「番茄钟」子菜单是内置入口（开始/暂停/继续/查看剩余/跳过/重置），
 * 这张卡负责配置这些动作背后的时长与节奏；只改本地状态，随「保存」整包写入。
 * 文案池不在设置页暴露——保存时透传保留，想自定义请手改 main-config.jsonc。
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
