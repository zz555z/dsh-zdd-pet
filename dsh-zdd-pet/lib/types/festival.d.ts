import type { RankedEntry } from './time-context/entries.ts';
import type { FestivalParams } from '../shared/festival.ts';
import type { HostSetup } from './plugin/setup.ts';
/** 节日名 → 内置动画名（素材都在包内 assets/webm；不存在时只弹文字，不报错）。 */
export declare const FESTIVAL_ANIMATIONS: Readonly<Record<string, string>>;
/** 节日名 → 内置祝福语（未列出的节日走通用模板）。 */
export declare const FESTIVAL_TEXTS: Readonly<Record<string, string>>;
/** 从 date 出发的本地日期键（YYYY-M-D；用于跨重启去重）。 */
export declare function dateKeyOf(date: Date): string;
/**
 * 当天命中的节日（取优先级最高的一个）；无节日 → undefined。
 * 只认「当天正好是节日」（公历/农历/除夕），不做节前预热——预热已在碎碎念文案里体现。
 */
export declare function festivalOf(date: Date): RankedEntry | undefined;
/** 动画名是否存在于任意动画池（防播不存在的名字导致 404 卡住）。 */
export declare function animExists(anims: unknown, target: string): boolean;
/** 一次节日演出的内容。 */
export interface FestivalCue {
    /** 节日名 */
    name: string;
    /** 气泡文案 */
    text: string;
    /** 要播的动画名（可能不存在于该宠物池，调用方自行判断） */
    anim?: string;
}
/**
 * 计算一次节日演出：未启用 / 当天无节日 → undefined。
 * 文案与动画先看配置覆盖，再看内置表，最后通用模板 / 无动画。
 */
export declare function resolveFestival(date: Date, params: FestivalParams): FestivalCue | undefined;
/** 节日自动演出所需依赖。 */
export type FestivalDeps = Pick<HostSetup, 'configPaths' | 'state' | 'log' | 'memeDirsFor' | 'userRoot'>;
/**
 * 启动时检查并在命中节日时给每只宠物投一句祝福 + 播节日动画。
 *
 * 投递口径与启动吉祥话一致：逐宠物、按所属条目的 festival 配置；同一天只演一次（跨重启去重）。
 *
 * @param deps - 宿主装配期依赖。
 * @param now - 当前时刻（测试可注入）。
 * @returns 投递的宠物数；未启用 / 当天无节日 / 今天已演过 → 0。
 */
export declare function maybeFestival(deps: FestivalDeps, now?: Date): number;
/**
 * 亲密度纪念日演出：某宠物今天正好是「首次达到某阶段」的周年日（同月同日、非首次当年），
 * 就播该阶段的纪念日祝福 + 动画。
 *
 * 首次达成日期由渲染端在升级时经 POST /intimacy 上报并落盘（见 routes/intimacy.ts），
 * 记录在 intimacy-state.json 的 petId → (stage → YYYY-M-D)。只有当首次日期存在、今天月日与之相同、
 * 且不是同一年时才算周年（首次当天不算，避免和刚弹出的升级气泡重复）。
 *
 * @returns 投递的宠物数。
 */
export declare function maybeIntimacyAnniversary(deps: FestivalDeps, now?: Date): number;
/**
 * 记录一次亲密度阶段首次达成（由渲染端升级时上报）。已存在该阶段的首次日期则不覆盖。
 * @returns 是否新写入。
 */
export declare function recordIntimacyReach(userRoot: string, petId: string, stage: string, dateKey: string): boolean;
