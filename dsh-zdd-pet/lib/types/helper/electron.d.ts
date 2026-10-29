import { type LoggerLike } from '../log-file.ts';
import type { HelperOptions } from './child.ts';
/** 包根：与宿主其它模块共用同一个锚点（见 ../paths.ts），不得按本文件目录另算一份。 */
export declare const packageRoot: string;
/** 默认的 Helper 入口（runtime/electron-helper/main.js）。 */
export declare const defaultHelperMain: string;
/**
 * 解析 Electron 可执行文件，按优先级取第一个存在且非空的候选：显式候选与 DSH_PET_ELECTRON_PATH
 * → 本机 electron npm 包 → $DSH_HOME/electron（下载落地路径）。
 * 只认自己的落地路径，不再去 npm 全局目录 / Program Files / /usr/bin 探测别人装的 Electron。
 * 都不存在时由 ensureElectronDownload() 在进程内异步下载（不 spawn 子进程，避免 process.execPath
 * 在 Electron 宿主里指向宿主 exe 而崩溃）。
 */
export declare function resolveElectronPath(candidates?: Array<string | undefined>): string | undefined;
/**
 * 判断当前环境能否真的跑起 Electron 图形窗口。
 *
 * Linux 无显示环境（服务器 / 容器 / 纯 CLI）下 Electron 能被下载并 spawn，却在初始化图形栈时崩溃；
 * 配合守护循环就变成每秒「拉起 → 崩溃 → 重启」，每个 core dump 约 14MB，几小时能堆到数十 GB 打满
 * 磁盘，所以必须在拉起之前判断。只拦「明确跑不起来」的：win32 / darwin 放行（macOS 无 DISPLAY 也走
 * WindowServer），linux 需要 DISPLAY 或 WAYLAND_DISPLAY 其一。逃生口 DSH_PET_DESKTOP_FORCE=1 强制
 * 跳过，供 Xvfb / 远程桌面等「环境变量没设但其实能显示」的场景使用。
 */
export declare function hasGraphicalDisplay(): boolean;
/** $DSH_HOME（默认 ~/.dsh）；测试与独立模式共用这一处推导。 */
export declare function dshHomeDir(): string;
/**
 * Electron 运行时落地目录（$DSH_HOME/electron）—— 下载解压的目标，也是设置页「卸载与存储」里让
 * 用户清理的那个目录。解析（resolveElectronPath / defaultElectronExe）与下载都必须走这里：同一个
 * 目录字面量在别处再写一遍，改了一处另一处没改，设置页就会显示一个永远不存在的路径。
 */
export declare function electronLandingDir(): string;
/** Electron 落地路径：$DSH_HOME/electron/<按平台的可执行文件>。 */
export declare function defaultElectronExe(): string;
/** 进程内下载 Electron 的选项。 */
export interface EnsureElectronOptions {
    /** Electron 版本号（默认 43.3.0，可被 DSH_PET_ELECTRON_VERSION 覆盖）。 */
    version?: string;
    /** 下载镜像（默认 npmmirror，可被 DSH_PET_ELECTRON_MIRROR 覆盖）。 */
    mirror?: string;
    /** 单次下载超时（默认 10 分钟）。 */
    timeoutMs?: number;
    /**
     * 面向用户的日志出口（进桌宠工作气泡）。与 console 分开：console 留英文原文给终端 / CLI 排障，
     * 这里产出给「没有控制台的 DSH 桌面版用户」看的一句短话。本函数只产出文本，不认识 state。
     */
    onLog?: (event: ElectronDownloadLog) => void;
    /** 落盘日志出口（宿主注入的统一日志器，见 ./log-file）；不传则退回 console。 */
    logger?: LoggerLike;
}
/** 一条下载日志：`text` 给用户看；`level='warn'` = 失败路径；`done` = 本次下载已收尾（成功或失败）。 */
export interface ElectronDownloadLog {
    text: string;
    level: 'info' | 'warn';
    done: boolean;
}
/**
 * 进程内下载并解压 Electron 到 $DSH_HOME/electron。
 *
 * 不 spawn 子进程：CLI node 与 Electron 宿主（DSH Desktop）里都可用，也避开了 process.execPath 在
 * 宿主里指向宿主 exe 而崩溃。已存在则原样返回；失败返回 undefined（不影响 DSH 与浏览器 overlay）。
 */
export declare function ensureElectronDownload(options?: EnsureElectronOptions): Promise<string | undefined>;
/**
 * 默认启动方式：Electron 可执行文件 + Helper 入口脚本。
 * @throws Electron 解析不到时抛错（调用方据此降级到浏览器宠物）。
 */
export declare function defaultLaunch(options?: HelperOptions): {
    command: string;
    args: string[];
};
