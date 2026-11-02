/**
 * 亲密度阶段卡（全局）：一个启用开关 + 四阶段只读说明。
 *
 * 阶段与台词/纪念日在 shared/intimacy.ts 里定义，设置页只暴露开关——想让某阶段换台词或纪念日，
 * 手改 main-config.jsonc 的 intimacy.stages（保存时由 existing 透传保留，不会被设置页抹掉）。
 * @module dsh-zdd-pet/src/client/settings/intimacy-card
 */
import type { FunctionComponent } from 'react';
import type { SettingsRuntime } from './runtime.ts';
import { INTIMACY_TIERS, intimacyStageOf, INTIMACY_THRESHOLDS } from '../../shared/intimacy.ts';
import type { IntimacyParams } from '../../shared/intimacy.ts';
import { makeUiKit } from './ui.ts';

/** 亲密度卡的输入。 */
export interface IntimacyCardProps {
  /** 保存中或配置未就绪时禁用全部控件。 */
  busy: boolean;
  /** 当前亲密度参数。 */
  intimacy: IntimacyParams;
  /** 改参数字段。 */
  onChange: (patch: Partial<IntimacyParams>) => void;
}

/**
 * 造亲密度卡。
 *
 * @param rt - 注入的 react 能力与翻译函数。
 * @returns 卡片组件。
 */
export function makeIntimacyCard(rt: SettingsRuntime): FunctionComponent<IntimacyCardProps> {
  const { h, t } = rt;
  const { cardHead, toggleCell } = makeUiKit({ h, t });

  return function IntimacyCard(props: IntimacyCardProps) {
    const { busy, intimacy } = props;
    // 各阶段的只读说明行：阶段名 · 阈值 · 专属纪念日（有的话）。
    const stageRows = INTIMACY_TIERS.map((tier) => {
      const stage = intimacyStageOf(intimacy, tier);
      const thr = INTIMACY_THRESHOLDS[tier];
      const parts = [stage.label + '（≥' + thr + '）', stage.motto];
      if (stage.festival) parts.push(t('intimacyFestivalPrefix') + stage.festival);
      return h('div', { className: 'dsh-zdd-pet-cfg__stage-row', children: parts.join(' · ') });
    });

    return h('div', {
      className: 'dsh-zdd-pet-cfg__card',
      children: [
        cardHead(t('intimacyTitle'), t('intimacyHint')),
        toggleCell('intimacyEnabled', intimacy.enabled, busy, (v) => props.onChange({ enabled: v })),
        h('div', { className: 'dsh-zdd-pet-cfg__stage-list', children: stageRows }),
      ],
    });
  };
}
