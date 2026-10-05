import { Flow } from "../models/Flow";
import { SubflowResolver } from "./SubflowResolver";

/** A subflow to descend into, with a caller-defined payload for that edge. */
export interface SubflowWalkStep<T> {
  flowName: string;
  payload: T;
}

/**
 * Depth-first walk over a chain of subflow calls, resolved synchronously via
 * `resolver.getSync`. Cycle-safe: each flow name is visited at most once per
 * walk. For every resolved flow, `visit` receives the flow, the payload
 * carried on the edge that reached it, and the call chain (root-first, ending
 * with this flow's name), and returns the next steps to descend into.
 *
 * Shared by every cross-flow analysis (loop rules, taint tracing) so cycle
 * detection and chain building live in one place.
 */
export function walkSubflowChainSync<T>(
  resolver: SubflowResolver,
  start: SubflowWalkStep<T>,
  visit: (flow: Flow, payload: T, chain: string[]) => SubflowWalkStep<T>[],
  visited: Set<string> = new Set<string>(),
  chain: string[] = []
): void {
  if (visited.has(start.flowName)) return;
  visited.add(start.flowName);

  const flow = resolver.getSync?.(start.flowName);
  if (!flow) return;

  const currentChain = [...chain, start.flowName];
  for (const next of visit(flow, start.payload, currentChain)) {
    walkSubflowChainSync(resolver, next, visit, visited, currentChain);
  }
}
