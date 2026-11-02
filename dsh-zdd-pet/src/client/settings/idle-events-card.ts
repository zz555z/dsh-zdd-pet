/**
 * 随机小事件卡（全局）：启用开关 + 两次事件的间隔范围（最短/最长秒）。
 *
 * 事件池（events）不在设置页暴露——想改「伸懒腰/张望」等具体动作，手改 main-config.jsonc 的
 * idleEvents.events（保存时由 existing 透传保留，不会被设置页抹掉）。
 * @module dsh-zdd-pet/src/client/settings/idle-events-card
 */
import type { ChangeEvent, FunctionComponent } from 'react';
import type { SettingsRuntime } from './runtime.ts';
import type { IdleEventsParams } from '../../shared/idle-events.ts';
import { IDLE_GAP_MAX_SEC, IDLE_GAP_MIN_SEC } from '../../shared/idle-events.ts';
import { INPUT_CLASS, makeUiKit } from './ui.ts';

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
export function makeIdleEventsCard(rt: SettingsRuntime): FunctionComponent<IdleEventsCardProps> {
  const { h, t } = rt;
  const { cardHead, field, toggleCell } = makeUiKit({ h, t });

  return function IdleEventsCard(props: IdleEventsCardProps) {
    const { busy, idleEvents } = props;

    const gapInput = (key: 'minGapSec' | 'maxGapSec', value: number) =>
      h('input', {
        type: 'number',
        className: INPUT_CLASS,
        step: '1',
        min: String(IDLE_GAP_MIN_SEC),
        max: String(IDLE_GAP_MAX_SEC),
        value: String(value),
        disabled: busy,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) props.onChange({ [key]: n });
        },
      });

    return h('div', {
      className: 'dsh-zdd-pet-cfg__card',
      children: [
        cardHead(t('idleEventsTitle'), t('idleEventsHint')),
        toggleCell('idleEventsEnabled', idleEvents.enabled, busy, (v) => props.onChange({ enabled: v })),
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid3',
          children: [
            field(t('idleEventsMin'), gapInput('minGapSec', idleEvents.minGapSec), t('idleEventsMinHint')),
            field(t('idleEventsMax'), gapInput('maxGapSec', idleEvents.maxGapSec), t('idleEventsMaxHint')),
          ],
        }),
      ],
    });
  };
}
