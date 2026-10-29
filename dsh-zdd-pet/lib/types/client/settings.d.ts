import type { FunctionComponent } from 'react';
import { petBridge } from './settings/bridge.ts';
import type { SettingsRuntime } from './settings/runtime.ts';
export { NS, zh, en } from './settings/locales.ts';
export type { Key } from './settings/locales.ts';
export { petBridge };
/**
 * 制造「桌宠配置」设置页组件。
 * 浏览器半侧是 `__ModuleLoader__` 单文件形态，react 能力只能由宿主在运行时注入，
 * 因此以工厂接收依赖，造出组件后再注册进设置页插槽。
 * @param rt - 运行时注入的依赖：`h`、hooks 与翻译函数 `t`。
 * @returns 设置页组件；`close` 由设置页外壳提供，本页未使用。
 */
export declare function makePetConfigSection(rt: SettingsRuntime): FunctionComponent<{
    close?: () => void;
}>;
