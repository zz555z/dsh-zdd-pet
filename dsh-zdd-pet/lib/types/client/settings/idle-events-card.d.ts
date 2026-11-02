/**
 * 随机小事件卡（全局）：启用开关 + 两次事件的间隔范围（最短/最长秒）。
 *
 * 事件池（events）不在设置页暴露——想改「伸懒腰/张望」等具体动作，手改 main-config.jsonc 的
 * idleEvents.events（保存时由 existing 透传保留，不会被设置页抹掉）。
 * @module dsh-zdd-pet/src/client/settings/idle-events-card
 */
import type { FunctionComponent } from 'react';
import type { SettingsRuntime } from './runtime.ts';
import type { IdleEventsParams } from '../../shared/idle-events.ts';
/** 随机小事件卡的输入。 */
export interface IdleEventsCardProps {
    /** 保存中或配置未就绪时禁用全部控件。 */
    busy: boolean;
    /** 当前参数。 */
    idleEvents: IdleEventsParams;
    /** 改参数字段。 */
    onChange: (patch: Partial<IdleEventsParams>) => void;
}
/**
 * 造随机小事件卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export declare function makeIdleEventsCard(rt: SettingsRuntime): FunctionComponent<IdleEventsCardProps>;
