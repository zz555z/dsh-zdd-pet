/**
 * 插件入口：Cordis 插件，把 host 半侧的配置、路由、斜杠命令、轮询与桌面 Helper 装配到 ctx。
 * 装配顺序不能改：`getHandlePetRoute` 惰性取用（`httpRoute` 在本函数后段才创建），`startHelper` 必须最后调用。
 * @module dsh-zdd-pet/src/host/index
 */
import { createHostSetup } from './plugin/setup.ts';
import { createHttpRoute, registerHttpRoute } from './plugin/http-route.ts';
import { registerLifecycle } from './plugin/lifecycle.ts';
import { registerChatCommand } from './plugin/command-chat.ts';
import { registerPetCommand } from './plugin/command-pet.ts';
import { registerLoops } from './plugin/loops.ts';
import { registerBalanceCommand } from './plugin/command-balance.ts';
import { registerSessionWatch } from './plugin/session-watch.ts';
import { createDesktopHelper } from './plugin/desktop-helper.ts';
import { createBalancePoll } from './plugin/balance-poll.ts';
import { createChatMemory } from './plugin/chat-memory.ts';
import { createMemoryFacts } from './plugin/memory-facts.ts';
import { createProactive } from './plugin/proactive.ts';
import { configuredModel } from './model-selection.ts';
import { createExtras } from './plugin/extras.ts';
import { maybeGreeting } from './greeting.ts';
import { maybeFestival, maybeIntimacyAnniversary } from './festival.ts';
import { createPomodoroEngine } from './pomodoro-engine.ts';
import { createSessionNotify } from './plugin/session-notify.ts';
import { createPetLookup } from './plugin/pet-lookup.ts';
import { createDownloadReport } from './plugin/download-report.ts';
import { createWorkStatusBridge } from './plugin/work-status-bridge.ts';
import type { PetRouteDeps } from './routes/types.ts';
import { readProactiveParams } from '../shared/proactive.ts';

/** 插件行 id（与 cordis.patch.yml 一致） */
export const name = 'pet';
/** 需要注入的服务：webServer（路由）+ agentDefaultModel（当前服务商）+ credentials（凭证）+ llm（对话模型调用）+ commands（/balance 斜杠命令）+ connection（桌面 Helper「打开 AI 设置」用的已鉴权站点 URL） */
export const inject = ['webServer', 'agentDefaultModel', 'credentials', 'llm', 'commands', 'connection'];

/** 宿主插件主体：注册 `/dsh-zdd-pet-7340` 前缀路由与斜杠命令（/balance /pet /chat）；ctx 暂用 any（peer 类型包本地不可解析）。 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- DSH 注入的 ctx（webServer/locale 等 service 无静态类型）
export function apply(ctx: any): void {
  const setup = createHostSetup(ctx);
  const {
    userRoot,
    log,
    configPaths,
    thumbUserRoot,
    memeDirsFor,
    standaloneAiPolicy,
    state,
    playback,
    workStatus,
    EXTERNAL_WORK_SESSION,
    nextExternalWorkSeq,
  } = setup;
  // 附加玩法（番茄钟 / 任务彩蛋 / 余额告急演出）的共用投递器：把预设文案+配图写进宠物气泡，
  // 不经模型、零 token。三个玩法各在 loops / session-watch / balance-poll 的接入点调用它。
  const extras = createExtras({ configPaths, memeDirsFor, state });
  const workStatusBridge = createWorkStatusBridge({ state, workStatus });
  const { publishWorkStatus, stopWorkStatusFlush } = workStatusBridge;
  const downloadReport = createDownloadReport({
    EXTERNAL_WORK_SESSION,
    nextExternalWorkSeq,
    publishWorkStatus,
    workStatus,
  });
  const { reportDownload, stopDownloadSlotTimer } = downloadReport;
  const petLookup = createPetLookup({ state });
  const { lock } = petLookup;
  const sessionNotify = createSessionNotify({ ctx, publishWorkStatus, state, workStatus });
  const {
    pushNotifyFrame,
    turnFlags,
    terminalTimers,
    lastTodoText,
    toolsInFlight,
    cancelTerminalCleanup,
    scheduleTerminalCleanup,
    notifyActivityTimers,
    scheduleCompletionNotify,
  } = sessionNotify;
  const memoryFacts = createMemoryFacts({ userRoot, ctx, log });
  const chatMemory = createChatMemory({
    ctx,
    configPaths,
    log,
    memeDirsFor,
    state,
    userRoot,
    readFacts: memoryFacts.readFacts,
    factsPromptSection: memoryFacts.factsPromptSection,
    extractFacts: memoryFacts.extractFacts,
    longMemoryEnabled: (conf) => readProactiveParams(conf.proactive).longMemory,
  });
  const { lastWhisperAt, publishWhisper, chatWithPet, getActivePetId, setActivePetId } = chatMemory;

  // 主动关心：久未搭理 / 深夜还在忙 / 刚做完专注时自己冒一句关心。
  const proactive = createProactive({
    ctx,
    configPaths,
    state,
    log,
    memeDirsFor,
    configuredModel,
    // 「最近在工作活动」：工作状态快照最近一次变化在 10 分钟内即算在忙（深夜提醒用）。
    recentlyActive: () => {
      const ts = workStatus.snapshot().ts;
      return ts > 0 && Date.now() - ts < 10 * 60 * 1000;
    },
  });
  // 对话 = 真实交互，刷新「上次交互」时刻（主动关心据此判久未搭理）。
  const chatWithPetTracked: typeof chatWithPet = (petId, text, image) => {
    proactive.touchInteraction(petId);
    return chatWithPet(petId, text, image);
  };

  const pomodoro = createPomodoroEngine({
    configPaths,
    state,
    log,
    memeDirsFor,
    deliverCue: extras.deliverCue,
    pickPetMeme: extras.pickPetMeme,
    onFocusComplete: (petId) => proactive.markFocusComplete(petId),
  });
  ctx.effect(() => () => pomodoro.dispose(), 'dsh-zdd-pet: pomodoro engine');

  const balancePoll = createBalancePoll({
    ctx,
    configPaths,
    deliverCue: extras.deliverCue,
    getActivePetId,
    log,
    memeValid: extras.memeValid,
    state,
  });
  const { effectivePetList, balancePeriodSec, whisperPeriodSec, refreshBalance, resolveActivePetId, petDisplayName } =
    balancePoll;

  const desktopHelper = createDesktopHelper({
    ctx,
    configPaths,
    effectivePetList,
    log,
    reportDownload,
    thumbUserRoot,
    // 惰性取用：handlePetRoute 在下方装配，Helper 只在启动/收请求时才真正调用它
    getHandlePetRoute: () => httpRoute.handlePetRoute,
  });
  const { startHelper, stopHelper, markDisposed } = desktopHelper;

  const deps: PetRouteDeps = {
    ...setup,
    pomodoro,
    ...petLookup,
    ...workStatusBridge,
    ...chatMemory,
    ...balancePoll,
    ...desktopHelper,
    ...sessionNotify,
    ctx,
    // 用带「主动关心交互追踪」的对话入口覆盖 chatMemory 里那份。
    chatWithPet: chatWithPetTracked,
  };
  const httpRoute = createHttpRoute(deps);
  registerHttpRoute(ctx, httpRoute.handlePetRoute);

  registerSessionWatch({
    ctx,
    cancelTerminalCleanup,
    clearConfirm: extras.clearConfirm,
    deliverComplete: extras.deliverComplete,
    deliverConfirm: extras.deliverConfirm,
    deliverEasterEgg: extras.deliverEasterEgg,
    lastTodoText,
    log,
    notifyActivityTimers,
    publishWorkStatus,
    pushNotifyFrame,
    scheduleCompletionNotify,
    scheduleTerminalCleanup,
    terminalTimers,
    toolsInFlight,
    turnFlags,
    workStatus,
  });

  registerBalanceCommand({ ctx, refreshBalance });

  registerLoops({
    ctx,
    balancePeriodSec,
    configPaths,
    deliverCue: extras.deliverCue,
    lastWhisperAt,
    lock,
    log,
    pickPetMeme: extras.pickPetMeme,
    publishWhisper,
    refreshBalance,
    standaloneAiPolicy,
    whisperPeriodSec,
  });

  // 主动关心循环：低频检查久未搭理 / 深夜还在忙 / 刚做完专注，触发时自己冒一句关心。
  proactive.start();

  registerPetCommand({ ctx, effectivePetList, petDisplayName, resolveActivePetId, setActivePetId });
  registerChatCommand({ ctx, chatWithPet: chatWithPetTracked, log, publishWhisper, resolveActivePetId });

  registerLifecycle({
    ctx,
    lock,
    markDisposed,
    playback,
    state,
    stopDownloadSlotTimer,
    stopHelper,
    stopWorkStatusFlush,
  });

  // 启动吉祥话：每次 DSH 启动让宠物说一句吉利话（pool 从池抽 / live 现生成，失败用内置兜底）。
  // 非阻塞：不 await，生成要几秒，别拖慢启动。节日演出排在问候之后，避免被晚到的问候气泡顶掉。
  void (async () => {
    try {
      await maybeGreeting({ ctx, configPaths, state, log, memeDirsFor, userRoot });
    } catch {
      /* 问候失败不影响插件 */
    }
    try {
      maybeFestival({ configPaths, state, log, memeDirsFor, userRoot });
    } catch {
      /* 节日演出是锦上添花，失败静默 */
    }
    try {
      maybeIntimacyAnniversary({ configPaths, state, log, memeDirsFor, userRoot });
    } catch {
      /* 亲密度纪念日同样是锦上添花，失败静默 */
    }
  })();

  // 路由就绪后拉起桌面 Helper（Electron 缺失时仅告警，不影响 DSH 与浏览器 overlay）
  startHelper();
}
