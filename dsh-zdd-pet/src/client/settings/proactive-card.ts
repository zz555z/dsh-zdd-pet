/**
 * 主动关心 + 长期记忆卡（全局）：开关 + 冷却/久未搭理/深夜时段 + 长期记忆开关。
 *
 * 文案池不在设置页暴露——想改主动关心的措辞就得改代码（prompt 固定）。数值都在这里调。
 * @module dsh-zdd-pet/src/client/settings/proactive-card
 */
import type { ChangeEvent, FunctionComponent } from 'react';
import type { SettingsRuntime } from './runtime.ts';
import type { ProactiveParams } from '../../shared/proactive.ts';
import { INPUT_CLASS, makeUiKit } from './ui.ts';

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
export function makeProactiveCard(rt: SettingsRuntime): FunctionComponent<ProactiveCardProps> {
  const { h, t } = rt;
  const { cardHead, field, toggleCell } = makeUiKit({ h, t });

  return function ProactiveCard(props: ProactiveCardProps) {
    const { busy, proactive } = props;

    const num = (key: 'cooldownHours' | 'idleHours', value: number, min: number, max: number) =>
      h('input', {
        type: 'number',
        className: INPUT_CLASS,
        step: '1',
        min: String(min),
        max: String(max),
        value: String(value),
        disabled: busy,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) props.onChange({ [key]: n });
        },
      });

    const hour = (key: 'lateNightFrom' | 'lateNightTo', value: number) =>
      h('input', {
        type: 'number',
        className: INPUT_CLASS,
        step: '1',
        min: '0',
        max: '23',
        value: String(value),
        disabled: busy,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) props.onChange({ [key]: Math.trunc(n) });
        },
      });

    return h('div', {
      className: 'dsh-zdd-pet-cfg__card',
      children: [
        cardHead(t('proactiveTitle'), t('proactiveHint')),
        toggleCell('proactiveEnabled', proactive.enabled, busy, (v) => props.onChange({ enabled: v })),
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid3',
          children: [
            field(
              t('proactiveCooldown'),
              num('cooldownHours', proactive.cooldownHours, 1, 720),
              t('proactiveCooldownHint'),
            ),
            field(t('proactiveIdle'), num('idleHours', proactive.idleHours, 1, 720), t('proactiveIdleHint')),
          ],
        }),
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid3',
          children: [
            field(t('proactiveLateFrom'), hour('lateNightFrom', proactive.lateNightFrom), t('proactiveLateHint')),
            field(t('proactiveLateTo'), hour('lateNightTo', proactive.lateNightTo)),
          ],
        }),
        toggleCell('proactiveLongMemory', proactive.longMemory, busy, (v) => props.onChange({ longMemory: v })),
      ],
    });
  };
}
