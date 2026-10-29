import type { HostSetup } from './setup.ts';
/** 投递所需的宿主能力。 */
export type ExtrasInput = Pick<HostSetup, 'configPaths'> & Pick<HostSetup, 'memeDirsFor'> & Pick<HostSetup, 'state'>;
/** 一条待投递的气泡内容：文案 + 可选表情包名（配图）。 */
export interface CueContent {
    text: string;
    image?: string;
}
/**
 * 创建附加玩法投递器。
 *
 * @param deps - 宿主能力（配置路径 / 表情包目录链 / 轮询快照）。
 * @returns 投递函数与随机取表情包的工具。
 */
export declare function createExtras(deps: ExtrasInput): {
    deliverCue: (petId: string, cue: CueContent) => boolean;
    pickPetMeme: (petId: string) => string | undefined;
    petConf: (petId: string) => Record<string, unknown> | undefined;
    deliverEasterEgg: (state: "success" | "error", rand?: () => number) => number;
    memeValid: (petId: string, name: string) => boolean;
};
/** 附加玩法投递器。 */
export type Extras = ReturnType<typeof createExtras>;
