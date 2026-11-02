/**
 * 亲密度达成上报路由：POST /intimacy?pet=&stage=&date=
 *
 * 渲染端在心情跨过亲密度阶段边界时调用，把「首次达到某阶段」的日期交给宿主落盘。
 * 宿主据此在周年当天触发纪念日演出（见 ../festival.ts 的 maybeIntimacyAnniversary）。
 * 只做参数校验与落盘，不产生气泡。
 * @module dsh-zdd-pet/src/host/routes/intimacy
 */
import { INTIMACY_TIERS, type IntimacyTier } from '../../shared/intimacy.ts';
import { recordIntimacyReach } from '../festival.ts';
import type { PetRouteDeps, RouteInput } from './types.ts';
import type { RouteResult } from '../http.ts';
import { failResult, methodNotAllowed, okResult } from './result.ts';

/** 亲密度领域：未命中返回 undefined，命中返回应答。 */
export async function handleIntimacyRoutes(deps: PetRouteDeps, input: RouteInput): Promise<RouteResult | undefined> {
  const { rest, method, url } = input;
  if (rest !== 'intimacy') return undefined;
  if (method !== 'POST') return methodNotAllowed();
  const pet = String(url.searchParams.get('pet') ?? '');
  const stage = String(url.searchParams.get('stage') ?? '');
  const date = String(url.searchParams.get('date') ?? '');
  if (!pet) return failResult('bad-request', '缺少 pet');
  if (!INTIMACY_TIERS.includes(stage as IntimacyTier)) {
    return failResult('bad-request', 'stage 必须是 stranger / familiar / close / bonded');
  }
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) return failResult('bad-request', 'date 必须是 YYYY-M-D');
  try {
    recordIntimacyReach(deps.userRoot, pet, stage, date);
    return okResult({ ok: true });
  } catch (e) {
    return failResult('generate-error', e instanceof Error ? e.message : String(e));
  }
}
