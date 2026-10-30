import type { PetRouteDeps, RouteInput } from './types.ts';
import type { RouteResult } from '../http.ts';
/** 番茄钟领域：未命中返回 undefined，命中返回应答。 */
export declare function handlePomodoroRoutes(deps: PetRouteDeps, input: RouteInput): Promise<RouteResult | undefined>;
