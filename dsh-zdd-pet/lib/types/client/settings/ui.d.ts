import type { jsx } from 'react/jsx-runtime';
import type { SettingsRuntime } from './runtime.ts';
/** 输入框与下拉框共用的类名。 */
export declare const INPUT_CLASS = "dsh-zdd-pet-cfg__inp";
/** 等宽字体栈（路径与命令展示用），走系统栈以免多拉一份资源。 */
export declare const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, \"Courier New\", monospace";
/** 设置页的共用小件；由 {@link makeUiKit} 一次造好，各卡片共享同一套翻译与节点工厂。 */
export interface SettingsUiKit {
    /** 悬浮说明的展开属性：带 `data-tip` 即悬浮出气泡。 */
    tip: (text: string, end?: boolean) => Record<string, string>;
    /** 问号说明入口：气泡的圆形触发元素。 */
    q: (text: string, end?: boolean) => ReturnType<typeof jsx>;
    /** 卡片头：标题与问号说明；右侧动作由调用方自行追加。 */
    cardHead: (title: string, hint?: string, end?: boolean) => ReturnType<typeof jsx>;
    /** 一个字段：标签（可带问号）在上、控件在下。 */
    field: (label: string, control: ReturnType<typeof jsx>, hint?: string, end?: boolean) => ReturnType<typeof jsx>;
    /** 开关的一格：勾选框、标题与问号；说明挂在问号上，点标题只切开关。 */
    toggleCell: (label: string, value: boolean, disabled: boolean, onToggle: (value: boolean) => void, end?: boolean) => ReturnType<typeof jsx>;
}
/**
 * 造设置页的共用小件。
 *
 * @param rt - 只用到节点工厂 `h` 与翻译 `t`。
 * @returns 各卡片共享的小件集合。
 */
export declare function makeUiKit(rt: Pick<SettingsRuntime, 'h' | 't'>): SettingsUiKit;
