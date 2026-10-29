/**
 * 启动吉祥话配置（greeting）的默认值与校验：设置页与宿主共用同一份规则。
 *
 * 运行时「生成池 / 抽一句 / 投气泡」归 host 的 greeting.ts；本模块只管配置的形状与默认。
 * 必须始终成立：DEFAULT_GREETING 与包内 config.jsonc 的 greeting 段一致，改一处须同步另一处。
 * @module dsh-zdd-pet/src/shared/greeting
 */
import type { GreetingParams } from './types.ts';
/** 池模式预生成句数的下限 / 上限（太少不够随机，太多模型一次输出易被截断）。 */
export declare const GREETING_POOL_MIN = 1;
export declare const GREETING_POOL_MAX = 200;
export declare const GREETING_DEFAULT_POOL_SIZE = 100;
/** 内置默认（与 assets/config.jsonc 的 greeting 段保持一致）。 */
export declare const DEFAULT_GREETING: GreetingParams;
/**
 * greeting 段校验：enabled 布尔、mode ∈ {'pool','live'}、poolSize 在范围内。
 * 整段校验（与 pomodoro 同口径）：任一子键非法即整段非法。
 */
export declare function greetingValid(value: unknown): boolean;
