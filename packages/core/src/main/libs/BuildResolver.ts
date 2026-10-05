import { Flow } from "../models/Flow";
import { PreloadedResolver } from "./SubflowResolver";

/**
 * Loads a single flow by API name from some environment. The environment
 * decides *how* (read from disk, fetch from an org's Tooling API, look up in
 * memory); `buildResolver` decides *which* flows are needed. Return `undefined`
 * for a flow that cannot be found — it is skipped, and rules that care surface
 * it (e.g. UnresolvedSubflow).
 */
export type FlowSource = (flowName: string) => Promise<Flow | undefined>;

export interface BuildResolverOptions {
  /** Maximum number of subflow hops to follow from the roots (default: unlimited). */
  maxDepth?: number;
  /** Skip managed-package flows (API names containing "__"). Default: true. */
  skipManaged?: boolean;
}

/**
 * Build a {@link PreloadedResolver} by resolving the transitive subflow
 * dependency closure of the given root flows.
 *
 * Environment-agnostic: pass a `source` that knows how to load one flow, and
 * this walks the `<subflows>` references breadth-first (deduped, cycle-safe)
 * until the closure is complete. This is the browser/async counterpart to the
 * filesystem resolvers — it fetches only the flows actually referenced rather
 * than indexing an entire directory, which matters when loading is expensive
 * (e.g. one Tooling API call per flow).
 *
 * The returned resolver is eager: every reachable flow is already loaded, so
 * the synchronous `getSync` traversal used by the rule engine works over it.
 */
export async function buildResolver(
  roots: Flow[],
  source: FlowSource,
  options: BuildResolverOptions = {}
): Promise<PreloadedResolver> {
  const { maxDepth = Infinity, skipManaged = true } = options;
  const resolver = new PreloadedResolver();
  const known = new Set<string>();

  const shouldFollow = (name: string): boolean =>
    !known.has(name) && !(skipManaged && name.includes("__"));

  const collect = (flow: Flow, into: Set<string>): void => {
    for (const name of flow.getSubflowNames()) {
      if (shouldFollow(name)) into.add(name);
    }
  };

  // Roots are already parsed; register them so intra-set references resolve too.
  for (const root of roots) {
    if (root?.name) {
      resolver.addFlow(root.name, root);
      known.add(root.name);
    }
  }

  let frontier = new Set<string>();
  for (const root of roots) {
    if (root) collect(root, frontier);
  }

  let depth = 0;
  while (frontier.size > 0 && depth < maxDepth) {
    const batch = [...frontier];
    frontier = new Set<string>();

    const loaded = await Promise.all(
      batch.map(async (name) => {
        known.add(name);
        try {
          return { name, flow: await source(name) };
        } catch {
          return { name, flow: undefined };
        }
      })
    );

    for (const { name, flow } of loaded) {
      if (!flow) continue;
      resolver.addFlow(name, flow);
      collect(flow, frontier);
    }
    depth++;
  }

  return resolver;
}
