import { Flow } from "../models/Flow";
import { FlowNode } from "../models/FlowNode";
import { FlowDataFlow, SubflowBoundary } from "../models/FlowDataFlow";
import { SubflowResolver } from "./SubflowResolver";
import { SubflowWalkStep, walkSubflowChainSync } from "./SubflowWalker";

/** Elements that touch the database — potential sinks for untrusted data. */
const RECORD_OPERATIONS = new Set([
  "recordLookups",
  "recordCreates",
  "recordUpdates",
  "recordDeletes",
]);

/** Flow running mode that bypasses the running user's sharing rules. */
const WITHOUT_SHARING_MODE = "SystemModeWithoutSharing";

export interface TaintSeedOptions {
  /** Treat screen input fields as untrusted (default true). */
  screenInputs?: boolean;
  /** Treat flow input variables as untrusted (default true). */
  inputVariables?: boolean;
  /** Additional global references to treat as untrusted (e.g. "$CurrentUser"). */
  globals?: string[];
}

export interface TaintFinding {
  /** Node in the analyzed (top) flow to report the finding on. */
  nodeName: string;
  /** `sink`: tainted data used by a DB op in a without-sharing flow.
   *  `cross-sharing`: tainted data passed into a subflow that runs without sharing. */
  kind: "sink" | "cross-sharing";
  /** Subtype of the offending element. */
  sinkType: string;
  /** The tainted variables involved. */
  taintedVariables: string[];
  /** For cross-sharing findings, the callee flow name. */
  targetFlow?: string;
  /** Chain of flow names from the analyzed flow to the offending flow. */
  callChain?: string[];
}

/** True when a flow executes in system mode without enforcing sharing rules. */
export function runsWithoutSharing(flow: Flow): boolean {
  const mode = (flow.xmldata as Record<string, unknown> | undefined)?.runInMode;
  return mode === WITHOUT_SHARING_MODE;
}

/**
 * Taint analysis for Salesforce flows.
 *
 * Propagates "untrusted" markings from sources (screen inputs, flow input
 * variables, configured globals) through the flow's def-use graph to sinks
 * (database operations running without sharing, or subflow calls that hand
 * untrusted data to a flow running without sharing). Propagation is
 * flow-insensitive — a sound over-approximation ("may be tainted"). Cross-flow
 * analysis follows subflow calls via the resolver, with cycle detection.
 */
export class TaintAnalyzer {
  /** Def-use graphs are pure derivations of a flow's structure, so they are
   * memoized by flow name for the analyzer's lifetime — a shared utility
   * subflow referenced by many flows is only analyzed structurally once. */
  private readonly dataFlowCache = new Map<string, FlowDataFlow>();

  constructor(private readonly resolver?: SubflowResolver) {}

  /** Get (or build and cache) the def-use graph for a flow. */
  public getDataFlow(flow: Flow): FlowDataFlow {
    let dataFlow = this.dataFlowCache.get(flow.name);
    if (!dataFlow) {
      dataFlow = new FlowDataFlow(flow);
      this.dataFlowCache.set(flow.name, dataFlow);
    }
    return dataFlow;
  }

  /** Collect the initial set of untrusted (tainted) variables for a flow. */
  public collectSeeds(dataFlow: FlowDataFlow, options: TaintSeedOptions = {}): Set<string> {
    const { screenInputs = true, inputVariables = true, globals = [] } = options;
    const seeds = new Set<string>();
    if (screenInputs) for (const s of dataFlow.getScreenInputs()) seeds.add(s);
    if (inputVariables) for (const v of dataFlow.getInputVariables()) seeds.add(v);
    for (const g of globals) seeds.add(g);
    return seeds;
  }

  /**
   * Flow-insensitive fixpoint: a node's writes become tainted when it reads any
   * tainted variable; a formula becomes tainted when any of its references is.
   */
  public computeTaintedVariables(
    flow: Flow,
    dataFlow: FlowDataFlow,
    seeds: Set<string>
  ): Set<string> {
    const tainted = new Set<string>(seeds);
    const formulaNames = dataFlow.getFormulaNames();
    const nodes = flow.elements.filter(
      (e): e is FlowNode => e instanceof FlowNode
    );

    let changed = true;
    while (changed) {
      changed = false;

      for (const formula of formulaNames) {
        if (tainted.has(formula)) continue;
        for (const ref of dataFlow.getFormulaRefs(formula)) {
          if (tainted.has(ref)) {
            tainted.add(formula);
            changed = true;
            break;
          }
        }
      }

      for (const node of nodes) {
        const du = dataFlow.getNode(node.name);
        if (!du || du.writes.size === 0) continue;
        let readsTainted = false;
        for (const r of du.reads) {
          if (tainted.has(r)) {
            readsTainted = true;
            break;
          }
        }
        if (!readsTainted) continue;
        for (const w of du.writes) {
          if (!tainted.has(w)) {
            tainted.add(w);
            changed = true;
          }
        }
      }
    }

    return tainted;
  }

  /**
   * Find taint violations for a flow: untrusted data reaching a without-sharing
   * database operation, or being passed into a subflow that runs without sharing.
   */
  public findViolations(
    flow: Flow,
    dataFlow: FlowDataFlow,
    options: TaintSeedOptions = {}
  ): TaintFinding[] {
    const seeds = this.collectSeeds(dataFlow, options);
    const tainted = this.computeTaintedVariables(flow, dataFlow, seeds);
    const findings: TaintFinding[] = [];

    // Intra-flow sinks: only meaningful when this flow bypasses sharing.
    if (runsWithoutSharing(flow)) {
      for (const node of flow.elements) {
        if (!(node instanceof FlowNode)) continue;
        if (!RECORD_OPERATIONS.has(node.subtype)) continue;
        const reads = dataFlow.getNode(node.name)?.reads;
        if (!reads) continue;
        const hits = [...reads].filter((r) => tainted.has(r));
        if (hits.length > 0) {
          findings.push({
            nodeName: node.name,
            kind: "sink",
            sinkType: node.subtype,
            taintedVariables: hits,
          });
        }
      }
    }

    // Cross-subflow: untrusted data handed to a flow running without sharing.
    const resolver = this.resolver;
    if (resolver?.getSync) {
      for (const boundary of dataFlow.getSubflowBoundaries()) {
        const taintedInputs = this.taintedCalleeInputs(boundary, tainted);
        if (taintedInputs.length === 0 || !boundary.flowName) continue;
        walkSubflowChainSync<string[]>(
          resolver,
          { flowName: boundary.flowName, payload: taintedInputs },
          (callee, calleeInputs, chain) =>
            this.visitTaintedCallee(callee, calleeInputs, chain, boundary.nodeName, findings),
          new Set<string>([flow.name]),
          [flow.name]
        );
      }
    }

    return findings;
  }

  /**
   * Walk callback for one tainted subflow call: report the callee if it runs
   * without sharing, and continue into deeper calls that still carry taint.
   */
  private visitTaintedCallee(
    callee: Flow,
    taintedCalleeInputs: string[],
    chain: string[],
    reportNode: string,
    findings: TaintFinding[]
  ): SubflowWalkStep<string[]>[] {
    const calleeDataFlow = this.getDataFlow(callee);
    const calleeTainted = this.computeTaintedVariables(
      callee,
      calleeDataFlow,
      new Set<string>(taintedCalleeInputs)
    );

    if (runsWithoutSharing(callee)) {
      findings.push({
        nodeName: reportNode,
        kind: "cross-sharing",
        sinkType: "subflows",
        taintedVariables: taintedCalleeInputs,
        targetFlow: chain[chain.length - 1],
        callChain: chain.length > 1 ? chain : undefined,
      });
    }

    const deeperSteps: SubflowWalkStep<string[]>[] = [];
    for (const boundary of calleeDataFlow.getSubflowBoundaries()) {
      const deeper = this.taintedCalleeInputs(boundary, calleeTainted);
      if (deeper.length > 0 && boundary.flowName) {
        deeperSteps.push({ flowName: boundary.flowName, payload: deeper });
      }
    }
    return deeperSteps;
  }

  private taintedCalleeInputs(
    boundary: SubflowBoundary,
    tainted: Set<string>
  ): string[] {
    return boundary.inputs
      .filter((i) => i.callerRefs.some((r) => tainted.has(r)))
      .map((i) => i.calleeVar);
  }

}
