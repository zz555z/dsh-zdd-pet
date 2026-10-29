import type { DesktopHelperDeps } from './types.ts';
import type { DesktopPets } from './pets.ts';
/** DesktopSpawn的输入。 */
export type DesktopSpawnInput = Pick<DesktopHelperDeps, 'ctx' | 'getHandlePetRoute' | 'log' | 'reportDownload' | 'thumbUserRoot'> & Pick<DesktopPets, 'getHasDesktopPet' | 'desktopPetList' | 'getTrayOn'>;
/**
 * 创建 Helper 进程的拉起与停止句柄：进程内宿主直接跳过，其余按需下载 Electron 后 spawn 并退避重试。
 */
export declare function createDesktopSpawn(deps: DesktopSpawnInput): {
    startHelper: () => void;
    stopHelper: (reason?: string) => void;
    stopHelperAndWait: (reason: string) => Promise<void>;
    markDisposed: () => void;
    assetRootFor: (ext: string) => string;
    userRootFor: (ext: string) => string;
};
/** DesktopSpawn的产出。 */
export type DesktopSpawn = ReturnType<typeof createDesktopSpawn>;
