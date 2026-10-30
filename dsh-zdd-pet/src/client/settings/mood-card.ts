/**
 * 心情 / 亲密度卡（全局）：一个启用开关 + 五个数值。
 *
 * 数值含义：initial 初始心情、touchGain 每次摸上涨几点、decayPerHour 每小时自然衰减几点、
 * low/high 低落与开心的分界（0~100）。文案池、开心/低落动画等高级项不在设置页暴露——
 * 保存时由 existing 透传保留，想自定义请手改 main-config.jsonc。
 * 与其它全局卡同语义：只改本地状态，随「保存」整包写入。
 * @module dsh-zdd-pet/src/client/settings/mood-card
 */
import type { ChangeEvent, FunctionComponent } from 'react';
import type { MoodParams } from '../../shared/types.ts';
import type { SettingsRuntime } from './runtime.ts';
import { INPUT_CLASS, makeUiKit } from './ui.ts';

/** 心情卡的输入。 */
export interface MoodCardProps {
  /** 保存中或配置未就绪时禁用全部控件。 */
  busy: boolean;
  /** 当前心情参数。 */
  mood: MoodParams;
  /** 改心情参数的若干字段。 */
  onChange: (patch: Partial<MoodParams>) => void;
}

/** 可编辑的数值字段。 */
type MoodNumKey = 'initial' | 'touchGain' | 'decayPerHour' | 'low' | 'high';

/**
 * 造心情卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makeMoodCard(rt: SettingsRuntime): FunctionComponent<MoodCardProps> {
  const { h, t } = rt;
  const { cardHead, field, toggleCell } = makeUiKit({ h, t });

  return function MoodCard(props: MoodCardProps) {
    const { busy, mood } = props;

    /** 0~100 的数字输入。 */
    const numInput = (key: MoodNumKey, value: number) =>
      h('input', {
        type: 'number',
        className: INPUT_CLASS,
        step: '1',
        min: '0',
        max: '100',
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
        cardHead(t('moodTitle'), t('moodHint')),
        // 开关单独一行：网格行是 align-items:end，和输入框放同一行会把开关压到最底部。
        toggleCell('moodEnabled', mood.enabled, busy, (v) => props.onChange({ enabled: v })),
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid3',
          children: [
            field(t('moodInitial'), numInput('initial', mood.initial), t('moodInitialHint')),
            field(t('moodTouchGain'), numInput('touchGain', mood.touchGain), t('moodTouchGainHint')),
            field(t('moodDecay'), numInput('decayPerHour', mood.decayPerHour), t('moodDecayHint')),
          ],
        }),
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid3',
          children: [
            field(t('moodLow'), numInput('low', mood.low), t('moodLowHint')),
            field(t('moodHigh'), numInput('high', mood.high), t('moodHighHint')),
          ],
        }),
      ],
    });
  };
}
