/**
 * 任务彩蛋（taskEasterEggs）——任务完成/出错时，往气泡投一条"配图 + 一句话"。
 *
 * 为什么单独成模块：配额、随机、文案截断这些是纯逻辑，放这里能单测；接入点（turn/end 终态）
 * 只负责"拿到配置 → 问这里要一条 → 写 say 叶子"。不调用模型，零 token。
 *
 * 配置形态（条目级，与 workStatusTexts 同级，可被 pet/<名>-config.json 顶层覆盖）：
 *   "taskEasterEggs": {
 *     "success": { "texts": ["今天也辛苦啦", "收工！摸鱼去"], "images": ["可爱", "吃饱饱摸肚子"] },
 *     "error":   { "texts": ["这次没跑通呢", "又卡住了，再等等"], "images": ["死掉了", "大的要来啦"] }
 *   }
 * 全部可选：没写某个档位 = 该档位不投彩蛋；images 为空 = 只投文字（等同普通碎碎念）；
 * 都为空 = 完全不投。images 里的名字必须命中该宠物条目表情包池（不命中就跳过这张，不报错）。
 */
/** 一个档位的彩蛋配置（都为空 = 不投） */
export interface EasterEggTier {
    texts: string[];
    images: string[];
}
/** 整体彩蛋配置：只认 success / error 两档（其余状态不算"一件事结束"） */
export interface EasterEggConfig {
    success?: EasterEggTier;
    error?: EasterEggTier;
}
/** 一句话文案上限（与 TASK_TEXT_MAX 同口径，按码点截断）——气泡宽度有限，太长的句子会盖住宠物 */
export declare const EASTER_TEXT_MAX = 24;
/** 从原始配置值解析成结构化配置；形状非法 → undefined（= 不投，绝不抛） */
export declare function parseEasterEggs(raw: unknown): EasterEggConfig | undefined;
/** 一条彩蛋：text 必填（文字气泡的载体），image 可缺省（缺省=纯文字） */
export interface EasterEggCue {
    text: string;
    image?: string;
}
/**
 * 为一个档位生成一条彩蛋；不该投 → undefined。
 *
 * 语义：有 images 就抽一张配图 + 抽一句文案（文案可缺省，缺省时只显示图）；
 *   只有 texts 没 images → 纯文字气泡。
 *   `poolNames` = 该宠物条目表情包池里的合法名字集合，用来过滤配置里写错的图名
 *   （写错的直接跳过，而不是让它变成一张破图）。
 *   rand 可注入，便于单测。
 */
export declare function pickEasterEgg(cfg: EasterEggConfig | undefined, state: 'success' | 'error', poolNames: ReadonlySet<string> | null, rand?: () => number): EasterEggCue | undefined;
