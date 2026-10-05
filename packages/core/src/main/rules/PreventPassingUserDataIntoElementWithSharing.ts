import { Flow, FlowNode, Violation } from "../internals/internals";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { FlowType } from "../models/FlowType";
import { RuleCommon } from "../models/RuleCommon";
import { SubflowResolver } from "../libs/SubflowResolver";
import { TaintAnalyzer, TaintFinding } from "../libs/TaintAnalyzer";

interface PreventPassingUserDataOptions {
  subflowResolver?: SubflowResolver;
  [key: string]: unknown;
}

/**
 * Flags untrusted (user-controlled) data flowing into an operation that runs
 * without enforcing the running user's sharing rules.
 *
 * User input (screen fields, flow input variables) is tracked through the flow's
 * data-flow graph. A violation is raised when that data:
 *  - reaches a database operation in a flow running in System Mode Without
 *    Sharing (the query/DML bypasses sharing using user-influenced values), or
 *  - is passed into a subflow that itself runs without sharing.
 *
 * Cross-subflow analysis requires a SubflowResolver; the intra-flow check runs
 * without one.
 */
export class PreventPassingUserDataIntoElementWithSharing
  extends RuleCommon
  implements IRuleDefinition
{
  // The analyzer memoizes def-use graphs, so it is kept for the rule
  // instance's lifetime (one scan) rather than rebuilt per flow — shared
  // subflows are then analyzed once per scan instead of once per caller.
  private analyzer?: TaintAnalyzer;
  private analyzerResolver?: SubflowResolver;

  constructor() {
    super(
      {
        ruleId: "prevent-passing-user-data-into-element-with-sharing",
        category: "problem",
        description:
          "Detects user-controlled data (screen inputs, flow input variables) reaching a " +
          "database operation that bypasses the running user's sharing rules, or being passed " +
          "into a subflow that runs in System Mode Without Sharing. Such data can be used to " +
          "read or modify records the user should not have access to.",
        summary: "User data reaches an operation that bypasses sharing",
        docRefs: [],
        label: "Prevent Passing User Data Into Element With Sharing",
        name: "PreventPassingUserDataIntoElementWithSharing",
        supportedTypes: [...FlowType.backEndTypes, ...FlowType.visualTypes],
      },
      { severity: "error" }
    );
  }

  protected check(
    flow: Flow,
    options: PreventPassingUserDataOptions | undefined,
    suppressions: Set<string>
  ): Violation[] {
    const resolver = options?.subflowResolver;
    if (!this.analyzer || this.analyzerResolver !== resolver) {
      this.analyzer = new TaintAnalyzer(resolver);
      this.analyzerResolver = resolver;
    }
    const dataFlow = this.analyzer.getDataFlow(flow);
    const findings = this.analyzer.findViolations(flow, dataFlow);

    const violations: Violation[] = [];
    for (const finding of findings) {
      if (suppressions.has(finding.nodeName)) continue;
      const node = this.findNode(flow, finding.nodeName);
      if (!node) continue;

      const violation = new Violation(node);
      Object.assign(violation, this.describe(finding));
      violations.push(violation);
    }

    return violations;
  }

  private describe(finding: TaintFinding): Partial<Violation> {
    const tainted = finding.taintedVariables.join(", ");
    if (finding.kind === "cross-sharing") {
      return {
        taintedVariables: finding.taintedVariables,
        referencedFlow: finding.targetFlow,
        ...(finding.callChain ? { callChain: finding.callChain } : {}),
        description:
          `User-controlled data (${tainted}) is passed into subflow ` +
          `"${finding.targetFlow}", which runs in System Mode Without Sharing.`,
      };
    }
    return {
      taintedVariables: finding.taintedVariables,
      sinkType: finding.sinkType,
      description:
        `User-controlled data (${tainted}) reaches a ${finding.sinkType} operation ` +
        `in a flow running in System Mode Without Sharing.`,
    };
  }

  private findNode(flow: Flow, name: string): FlowNode | undefined {
    return flow.elements.find(
      (e): e is FlowNode => e instanceof FlowNode && e.name === name
    );
  }
}
