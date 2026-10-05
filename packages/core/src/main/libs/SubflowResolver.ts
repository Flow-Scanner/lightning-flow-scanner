import { Flow } from "../models/Flow";

/**
 * Result of subflow resolution
 */
export interface ResolvedSubflow {
  /** The API name of the subflow */
  flowName: string;
  /** The resolved Flow object, or undefined if not found */
  flow?: Flow;
  /** Error message if resolution failed */
  error?: string;
  /** Whether this flow is managed (packaged) */
  isManaged?: boolean;
}

/**
 * Interface for resolving subflows from various sources.
 *
 * Implementations:
 * - NoOpResolver: Default, returns undefined (subflows not resolved)
 * - PreloadedResolver: Uses pre-loaded Flow objects (UMD/browser/MCP)
 * - FileSystemResolver: Loads from filesystem (Node.js/CLI only)
 */
export interface SubflowResolver {
  /**
   * Resolve a single subflow by its API name.
   * @param flowName - The API name of the subflow
   * @returns Resolution result with flow or error
   */
  resolve(flowName: string): Promise<ResolvedSubflow>;

  /**
   * Resolve multiple subflows at once.
   * Default implementation calls resolve() for each name.
   * @param flowNames - Array of subflow API names
   * @returns Map of flow names to resolution results
   */
  resolveMany(flowNames: string[]): Promise<Map<string, ResolvedSubflow>>;

  /**
   * Check if a subflow is available for resolution.
   * @param flowName - The API name to check
   * @returns true if the subflow can be resolved
   */
  has(flowName: string): boolean;

  /**
   * Get a flow synchronously if already loaded/cached.
   * Returns undefined if flow needs async loading or isn't available.
   * Used by rules that need synchronous access during check().
   * @param flowName - The API name of the subflow
   * @returns The Flow if available synchronously, undefined otherwise
   */
  getSync?(flowName: string): Flow | undefined;
}

/**
 * Default no-op resolver that doesn't resolve any subflows.
 * Used when subflow resolution is not configured.
 */
export class NoOpResolver implements SubflowResolver {
  async resolve(flowName: string): Promise<ResolvedSubflow> {
    return { flowName, flow: undefined };
  }

  async resolveMany(flowNames: string[]): Promise<Map<string, ResolvedSubflow>> {
    const results = new Map<string, ResolvedSubflow>();
    for (const name of flowNames) {
      results.set(name, { flowName: name, flow: undefined });
    }
    return results;
  }

  has(): boolean {
    return false;
  }

  getSync(): Flow | undefined {
    return undefined;
  }
}

/**
 * Resolver that uses pre-loaded Flow objects.
 * Ideal for UMD/browser environments where flows are fetched via API
 * (e.g., Salesforce Dependency API, Metadata API).
 *
 * @example
 * ```typescript
 * // Create resolver with pre-loaded flows
 * const resolver = new PreloadedResolver();
 *
 * // Add flows from Salesforce API response
 * for (const record of dependencyApiResponse.records) {
 *   const flow = new Flow(record.MetadataComponentName, record.xmlData);
 *   resolver.addFlow(record.MetadataComponentName, flow, {
 *     isManaged: record.ManageableState === 'managed'
 *   });
 * }
 *
 * // Use in scan
 * const results = await scan(parsedFlows, { subflowResolver: resolver });
 * ```
 */
export class PreloadedResolver implements SubflowResolver {
  private flows: Map<string, { flow: Flow; isManaged?: boolean }> = new Map();

  /**
   * Create a PreloadedResolver with optional initial flows.
   * @param initialFlows - Map of flow names to Flow objects
   */
  constructor(initialFlows?: Map<string, Flow>) {
    if (initialFlows) {
      for (const [name, flow] of initialFlows) {
        this.flows.set(name, { flow });
      }
    }
  }

  /**
   * Add a single flow to the resolver.
   * @param flowName - The API name of the flow
   * @param flow - The Flow object
   * @param options - Additional metadata
   */
  addFlow(flowName: string, flow: Flow, options?: { isManaged?: boolean }): void {
    this.flows.set(flowName, { flow, isManaged: options?.isManaged });
  }

  /**
   * Add multiple flows at once.
   * @param flows - Map of flow names to Flow objects
   */
  addFlows(flows: Map<string, Flow>): void {
    for (const [name, flow] of flows) {
      this.flows.set(name, { flow });
    }
  }

  /**
   * Add a flow from raw XML data.
   * @param flowName - The API name of the flow
   * @param xmlData - Parsed XML data (the Flow object from XML)
   * @param options - Additional metadata
   */
  addFlowFromXml(flowName: string, xmlData: unknown, options?: { isManaged?: boolean }): void {
    const flow = new Flow(flowName, xmlData);
    this.flows.set(flowName, { flow, isManaged: options?.isManaged });
  }

  /**
   * Remove a flow from the resolver.
   * @param flowName - The API name to remove
   */
  removeFlow(flowName: string): boolean {
    return this.flows.delete(flowName);
  }

  /**
   * Clear all flows from the resolver.
   */
  clear(): void {
    this.flows.clear();
  }

  /**
   * Get the number of loaded flows.
   */
  get size(): number {
    return this.flows.size;
  }

  /**
   * Get all loaded flow names.
   */
  getFlowNames(): string[] {
    return Array.from(this.flows.keys());
  }

  async resolve(flowName: string): Promise<ResolvedSubflow> {
    const entry = this.flows.get(flowName);
    if (entry) {
      return {
        flowName,
        flow: entry.flow,
        isManaged: entry.isManaged,
      };
    }
    return { flowName, flow: undefined };
  }

  async resolveMany(flowNames: string[]): Promise<Map<string, ResolvedSubflow>> {
    const results = new Map<string, ResolvedSubflow>();
    for (const name of flowNames) {
      results.set(name, await this.resolve(name));
    }
    return results;
  }

  has(flowName: string): boolean {
    return this.flows.has(flowName);
  }

  /**
   * Get a flow synchronously. PreloadedResolver always has flows in memory.
   * @param flowName - The API name of the subflow
   * @returns The Flow if available, undefined otherwise
   */
  getSync(flowName: string): Flow | undefined {
    return this.flows.get(flowName)?.flow;
  }
}

/** Default resolver instance */
export const defaultResolver: SubflowResolver = new NoOpResolver();
