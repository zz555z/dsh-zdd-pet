/**
 * 启动吉祥话卡（全局）：开关 + 模式下拉（语言池/每次生成）+ 池大小。
 * 与其它全局卡同语义：只改本地状态，随「保存」整包写入。
 *   - 语言池（pool）：首次调模型预生成一批（池大小句）存本地，之后每次启动随机抽一句，省 token。
 *   - 每次生成（live）：每次启动现调模型生成一句。
 * 模型不可用 / 池空时用内置兜底吉祥话，保证一定开口。
 * @module dsh-zdd-pet/src/client/settings/greeting-card
 */
import type { ChangeEvent, FunctionComponent } from 'react';
import type { GreetingParams } from '../../shared/types.ts';
import { GREETING_POOL_MAX, GREETING_POOL_MIN } from '../../shared/greeting.ts';
import type { SettingsRuntime } from './runtime.ts';
import { INPUT_CLASS, makeUiKit } from './ui.ts';

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
export function makeGreetingCard(rt: SettingsRuntime): FunctionComponent<GreetingCardProps> {
  const { h, t } = rt;
  const { cardHead, field, toggleCell } = makeUiKit({ h, t });

  return function GreetingCard(props: GreetingCardProps) {
    const { busy, greeting } = props;
    const poolMode = greeting.mode === 'pool';
    return h('div', {
      className: 'dsh-zdd-pet-cfg__card',
      children: [
        cardHead(t('greetingTitle'), t('greetingHint')),
        // 开关行：是否启用启动吉祥话。
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid2',
          children: [toggleCell('greetingEnabled', greeting.enabled, busy, (v) => props.onChange({ enabled: v }))],
        }),
        // 参数行：模式（下拉）+ 池大小（数字，仅 pool 模式有意义）。
        h('div', {
          className: 'dsh-zdd-pet-cfg__grid2',
          children: [
            field(
              t('greetingMode'),
              h('select', {
                className: INPUT_CLASS,
                value: greeting.mode,
                disabled: busy,
                onChange: (e: ChangeEvent<HTMLSelectElement>) =>
                  props.onChange({ mode: e.target.value === 'live' ? 'live' : 'pool' }),
                children: [
                  h('option', { key: 'pool', value: 'pool', children: t('greetingModePool') }),
                  h('option', { key: 'live', value: 'live', children: t('greetingModeLive') }),
                ],
              }),
              t('greetingModeHint'),
            ),
            field(
              t('greetingPoolSize'),
              h('input', {
                type: 'number',
                className: INPUT_CLASS,
                min: String(GREETING_POOL_MIN),
                max: String(GREETING_POOL_MAX),
                step: '1',
                value: String(greeting.poolSize),
                // 池大小只在 pool 模式下用得上；live 模式置灰避免误解
                disabled: busy || !poolMode,
                onChange: (e: ChangeEvent<HTMLInputElement>) => props.onChange({ poolSize: Number(e.target.value) }),
              }),
              t('greetingPoolSizeHint'),
              true,
            ),
          ],
        }),
      ],
    });
  };
}
