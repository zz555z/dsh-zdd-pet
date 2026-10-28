/**
 * 番茄钟卡（全局）：一整行只放一个「久坐提醒」下拉框。
 * 下拉选项 = 「关闭」+ 若干预设分钟档（shared/pomodoro 的 POMODORO_PRESET_INTERVALS_MIN）：
 *   选「关闭」= 停用；选某个分钟数 = 启用并把间隔设为它。开关与时长收进同一个下拉，卡片更紧凑统一。
 * 若当前配置的间隔不在预设里（用户手改过 config），把它动态补进选项并选中，不丢用户设置。
 * 与其它全局卡同语义：只改本地状态，随「保存」整包写入；宿主半侧到点让桌宠说一句（零 token）。
 * 文案池（texts）不在设置页暴露——保存时透传保留，想自定义请手改 main-config.jsonc。
 * @module dsh-zdd-pet/src/client/settings/pomodoro-card
 */
import type { ChangeEvent, FunctionComponent } from 'react';
import type { PomodoroParams } from '../../shared/types.ts';
import { POMODORO_PRESET_INTERVALS_MIN } from '../../shared/pomodoro.ts';
import type { SettingsRuntime } from './runtime.ts';
import { INPUT_CLASS, makeUiKit } from './ui.ts';

/** 番茄钟卡的输入。 */
export interface PomodoroCardProps {
  /** 保存中或配置未就绪时禁用全部控件。 */
  busy: boolean;
  /** 当前番茄钟参数。 */
  pomodoro: PomodoroParams;
  /** 改番茄钟参数的若干字段。 */
  onChange: (patch: Partial<PomodoroParams>) => void;
}

/** 下拉值编码：「关闭」用 'off'，其余是分钟数的字符串。 */
const OFF = 'off';

/**
 * 造番茄钟卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makePomodoroCard(rt: SettingsRuntime): FunctionComponent<PomodoroCardProps> {
  const { h, t } = rt;
  const { cardHead, field } = makeUiKit({ h, t });

  return function PomodoroCard(props: PomodoroCardProps) {
    const { busy, pomodoro } = props;
    // 当前值对应的下拉选项：关闭 → 'off'；启用 → 分钟数字符串。
    const currentValue = pomodoro.enabled ? String(pomodoro.intervalMin) : OFF;
    // 预设档位；当前启用值若不在此列（手改过配置），补进来并排好序，避免下拉选中丢失。
    const presets: number[] = [...POMODORO_PRESET_INTERVALS_MIN];
    if (pomodoro.enabled && !presets.includes(pomodoro.intervalMin)) {
      presets.push(pomodoro.intervalMin);
      presets.sort((a, b) => a - b);
    }
    const options = [OFF, ...presets.map(String)];

    const onSelect = (e: ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (v === OFF) props.onChange({ enabled: false });
      else props.onChange({ enabled: true, intervalMin: Number(v) });
    };

    return h('div', {
      className: 'dsh-zdd-pet-cfg__card',
      children: [
        cardHead(t('pomodoroTitle'), t('pomodoroHint')),
        // 单个字段占两列栅格的一格（与上方「对话历史条数 / 配图张数」同款栅格），一行完成。
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid2',
          children: [
            field(
              t('pomodoroLabel'),
              h('select', {
                className: INPUT_CLASS,
                value: currentValue,
                disabled: busy,
                onChange: onSelect,
                children: options.map((opt) =>
                  h('option', {
                    key: opt,
                    value: opt,
                    children: opt === OFF ? t('pomodoroOff') : t('pomodoroEvery').replace('{n}', opt),
                  }),
                ),
              }),
              t('pomodoroLabelHint'),
            ),
          ],
        }),
      ],
    });
  };
}
