/**
 * 番茄钟卡（全局）：专注 / 短休息 / 长休息 / 轮数 / 两个自动开关。
 *
 * 右键菜单的「番茄钟」子菜单是内置入口（开始/暂停/继续/查看剩余/跳过/重置），
 * 这张卡负责配置这些动作背后的时长与节奏；只改本地状态，随「保存」整包写入。
 * 文案池不在设置页暴露——保存时透传保留，想自定义请手改 main-config.jsonc。
 * @module dsh-zdd-pet/src/client/settings/pomodoro-card
 */
import type { ChangeEvent, FunctionComponent } from 'react';
import type { PomodoroParams } from '../../shared/types.ts';
import {
  POMODORO_DEFAULT_BREAK_MIN,
  POMODORO_DEFAULT_LONG_BREAK_MIN,
  POMODORO_DEFAULT_ROUNDS,
  POMODORO_PRESET_BREAKS_MIN,
  POMODORO_PRESET_INTERVALS_MIN,
} from '../../shared/pomodoro.ts';
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

/** 把当前值补进预设（手改过 config 的值不能在下拉里丢失）。 */
function withCurrent(presets: readonly number[], current: number): number[] {
  const out = [...presets];
  if (!out.includes(current)) {
    out.push(current);
    out.sort((a, b) => a - b);
  }
  return out;
}

/**
 * 造番茄钟卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makePomodoroCard(rt: SettingsRuntime): FunctionComponent<PomodoroCardProps> {
  const { h, t } = rt;
  const { cardHead, field, toggleCell } = makeUiKit({ h, t });

  return function PomodoroCard(props: PomodoroCardProps) {
    const { busy, pomodoro } = props;
    const focusValue = pomodoro.enabled ? String(pomodoro.intervalMin) : OFF;
    const focusOptions = [OFF, ...withCurrent(POMODORO_PRESET_INTERVALS_MIN, pomodoro.intervalMin).map(String)];
    const breakMin = pomodoro.breakMin ?? POMODORO_DEFAULT_BREAK_MIN;
    const longBreakMin = pomodoro.longBreakMin ?? POMODORO_DEFAULT_LONG_BREAK_MIN;
    const rounds = pomodoro.roundsBeforeLongBreak ?? POMODORO_DEFAULT_ROUNDS;
    const breakOptions = withCurrent(POMODORO_PRESET_BREAKS_MIN, breakMin);
    const longOptions = withCurrent(POMODORO_PRESET_BREAKS_MIN, longBreakMin);

    const onFocus = (e: ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      if (v === OFF) props.onChange({ enabled: false });
      else props.onChange({ enabled: true, intervalMin: Number(v) });
    };
    const onBreak = (e: ChangeEvent<HTMLSelectElement>) => props.onChange({ breakMin: Number(e.target.value) });
    const onLongBreak = (e: ChangeEvent<HTMLSelectElement>) => props.onChange({ longBreakMin: Number(e.target.value) });
    const onRounds = (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (Number.isFinite(n)) props.onChange({ roundsBeforeLongBreak: n });
    };

    return h('div', {
      className: 'dsh-zdd-pet-cfg__card',
      children: [
        cardHead(t('pomodoroTitle'), t('pomodoroHint')),
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid2',
          children: [
            field(
              t('pomodoroLabel'),
              h('select', {
                className: INPUT_CLASS,
                value: focusValue,
                disabled: busy,
                onChange: onFocus,
                children: focusOptions.map((opt) =>
                  h('option', {
                    key: opt,
                    value: opt,
                    children: opt === OFF ? t('pomodoroOff') : t('pomodoroEvery').replace('{n}', opt),
                  }),
                ),
              }),
              t('pomodoroLabelHint'),
            ),
            field(
              t('pomodoroBreakLabel'),
              h('select', {
                className: INPUT_CLASS,
                value: String(breakMin),
                disabled: busy,
                onChange: onBreak,
                children: breakOptions.map((opt) =>
                  h('option', {
                    key: opt,
                    value: String(opt),
                    children: t('pomodoroEvery').replace('{n}', String(opt)),
                  }),
                ),
              }),
              t('pomodoroBreakHint'),
            ),
          ],
        }),
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid2',
          children: [
            field(
              t('pomodoroLongBreakLabel'),
              h('select', {
                className: INPUT_CLASS,
                value: String(longBreakMin),
                disabled: busy,
                onChange: onLongBreak,
                children: longOptions.map((opt) =>
                  h('option', {
                    key: opt,
                    value: String(opt),
                    children: t('pomodoroEvery').replace('{n}', String(opt)),
                  }),
                ),
              }),
              t('pomodoroLongBreakHint'),
            ),
            field(
              t('pomodoroRoundsLabel'),
              h('input', {
                type: 'number',
                className: INPUT_CLASS,
                min: '1',
                max: '24',
                step: '1',
                value: String(rounds),
                disabled: busy,
                onChange: onRounds,
              }),
              t('pomodoroRoundsHint'),
            ),
          ],
        }),
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid2',
          children: [
            toggleCell('pomodoroAutoBreak', pomodoro.autoStartBreak !== false, busy, (v) =>
              props.onChange({ autoStartBreak: v }),
            ),
            toggleCell('pomodoroAutoFocus', pomodoro.autoStartFocus === true, busy, (v) =>
              props.onChange({ autoStartFocus: v }),
            ),
          ],
        }),
      ],
    });
  };
}
