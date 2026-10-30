import type { FontConfig, GreetingParams, ModelSelection, MoodParams, Pet, PhysicsParams, PomodoroParams } from '../../../shared/types.ts';
/** 宿主返回的成品聚合：`main` 是大配置条目，其余键是文件定义的其他宠物条目。 */
export type MergedConfig = Record<string, Record<string, unknown>>;
/** 表单要吃的补丁；字段缺省表示「这次响应里没有可信值」。 */
export interface MainConfigPatch {
    /** main 条目的宠物列表（已深拷贝位置，可直接进编辑列表）。 */
    pets?: Pet[];
    /** 条目级人设正文，作为实例人设「留空时跟随什么」的预览。 */
    entryPrompt?: string;
    notificationsEnabled?: boolean;
    clickSoundEnabled?: boolean;
    bubbleImageEnabled?: boolean;
    confineToScreen?: boolean;
    trayEnabled?: boolean;
    /** 物理参数：成品已按「内置默认 ← 用户层」填满，缺子键再用内置默认兜底一次。 */
    physics?: PhysicsParams;
    /** 字体：同物理参数。 */
    font?: FontConfig;
    /** 番茄钟（开关 + 提醒间隔）：成品已按内置默认填满，缺子键再用内置默认兜底一次。 */
    pomodoro?: PomodoroParams;
    /** 启动吉祥话（开关 / 模式 / 池大小）：同上，用内置默认补满。 */
    greeting?: GreetingParams;
    /** 心情 / 亲密度（开关 + 五个数值）：同上，用内置默认补满。 */
    mood?: MoodParams;
    whisperModel?: ModelSelection;
    chatModel?: ModelSelection;
    chatMemoryRounds?: number;
    chatImageLimit?: number;
}
/**
 * 从成品聚合里读出 main 条目的表单补丁。
 *
 * @param merged - `GET /config` 的响应体。
 * @returns 表单补丁；`main.pets` 缺失或不是数组时返回 `null`（响应本身坏了，调用方应报错）。
 */
export declare function readMainConfig(merged: MergedConfig): MainConfigPatch | null;
/** 一个条目（种类）与它的全部实例；`key` 即素材根。 */
export interface ConfigEntry {
    /** 条目名：`main`，或 `pet/<前缀>-config.json(c)` 的前缀。 */
    readonly key: string;
    /** `main` 由设置页连同全局字段整包写；`pack` 单独写回自己的配置文件。 */
    readonly kind: 'main' | 'pack';
    /** 条目级人设正文：实例人设留空时跟随的就是它（pack 各自一份，不共用 main 的）。 */
    readonly entryPrompt?: string;
    /** 该条目的实例；位置已深拷贝，`assetRoot` 即条目名。 */
    readonly pets: Pet[];
}
/**
 * 从成品聚合里读出全部条目及其实例（`main` 在前，其余按文件名顺序）。
 *
 * 只带实例字段：条目级的动画池、人设等大对象不挂到每只宠物上——设置页的提交体会被整包
 * 序列化，挂上去等于把动画池复制 N 份。
 *
 * @param merged - `GET /config` 的响应体。
 * @returns 条目列表；`main.pets` 缺失或不是数组时返回 `null`（响应本身坏了，调用方应报错）。
 */
export declare function readConfigEntries(merged: MergedConfig): ConfigEntry[] | null;
