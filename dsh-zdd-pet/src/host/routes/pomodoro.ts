/**
 * 番茄钟动作路由：POST /pomodoro?pet=&action=start|pause|resume|reset|skip|status
 *
 * 只做参数校验与转发；计时状态机在 ../pomodoro-engine.ts。
 * 动作结果通过 /state 的说话叶子回到气泡，本接口只回 {ok} 或结构化失败。
 * @module dsh-zdd-pet/src/host/routes/pomodoro
 */
import { readAllConfig } from '../config.ts';
import type { PomodoroAction } from '../pomodoro-engine.ts';
import type { PetRouteDeps, RouteInput } from './types.ts';
import type { RouteResult } from '../http.ts';
import { failResult, methodNotAllowed, okResult } from './result.ts';

/** 允许的动作集合。 */
const ACTIONS = new Set<PomodoroAction>(['start', 'pause', 'resume', 'stop', 'reset', 'skip', 'status']);

/** 番茄钟领域：未命中返回 undefined，命中返回应答。 */
export async function handlePomodoroRoutes(deps: PetRouteDeps, input: RouteInput): Promise<RouteResult | undefined> {
  const { rest, method, url } = input;
  if (rest !== 'pomodoro') return undefined;
  if (method !== 'POST') return methodNotAllowed();
  const raw = String(url.searchParams.get('action') ?? '');
  if (!ACTIONS.has(raw as PomodoroAction)) {
    return failResult('bad-request', 'action 必须是 start / pause / resume / stop / reset / skip / status');
  }
  try {
    const who = deps.requirePet(url.searchParams, () => readAllConfig(deps.configPaths));
    if (!who.ok) return who.res;
    const result = deps.pomodoro.control(raw as PomodoroAction, who.petId);
    return result.ok ? okResult({ ok: true }) : failResult('bad-request', result.message ?? '番茄钟动作失败');
  } catch (e) {
    return failResult('generate-error', e instanceof Error ? e.message : String(e));
  }
}
