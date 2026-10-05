import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { Flow, FlowNode, Violation } from "../internals/internals";
import { SubflowResolver } from "../libs/SubflowResolver";
import { SubflowWalkStep, walkSubflowChainSync } from "../libs/SubflowWalker";
import { RuleCommon } from "./RuleCommon";
import { RuleInfo } from "./RuleInfo";

interface LoopRuleOptions {
  subflowResolver?: SubflowResolver;
  [key: string]: unknown;
}

interface SubflowViolation {
  /** The subflow node in the parent flow (inside the loop) */
  subflowNode: FlowNode;
  /** The actual violating node in the child flow */
  violatingNode: FlowNode;
  /** The resolved child flow containing the violation */
  childFlow: Flow;
  /** For nested subflows: the chain of flow names from loop to violation */
  callChain?: string[];
}

export abstract class LoopRuleCommon extends RuleCommon implements IRuleDefinition {
  constructor(info: RuleInfo, optional?: { severity?: string }) {
    super(info, optional);
  }

  protected check(
    flow: Flow,
    options: LoopRuleOptions | undefined,
    suppressions: Set<string>
  ): Violation[] {
    const loopElements = flow.graph.getLoopNodes();
    if (!loopElements.length) {
      return [];
    }

    const results: Violation[] = [];

    // Find direct statements in loops
    const statementsInLoops = this.findStatementsInLoops(flow, loopElements);
    for (const node of statementsInLoops) {
      if (!suppressions.has(node.name)) {
        results.push(new Violation(node));
      }
    }

    // Find statements in subflows called from loops (if resolver provided)
    if (options?.subflowResolver) {
      const subflowViolations = this.findStatementsInSubflowsSync(
        flow,
        loopElements,
        options.subflowResolver
      );
      for (const sv of subflowViolations) {
        // Check suppression on the subflow call node (not the internal node)
        if (!suppressions.has(sv.subflowNode.name)) {
          // Report on the subflow call node, pointing at the internal issue
          const violation = new Violation(sv.subflowNode);
          violation.referencedFlow = sv.childFlow.name;
          violation.referencedElement = sv.violatingNode.name;
          violation.referencedType = sv.violatingNode.subtype;
          // Call chain for nested subflows (e.g., ["FlowA", "FlowB", "FlowC"])
          if (sv.callChain) {
            violation.callChain = sv.callChain;
          }
          results.push(violation);
        }
      }
    }

    return results;
  }

  protected abstract getStatementTypes(): string[];

  private findLoopElements(flow: Flow): FlowNode[] {
    return flow.graph.getLoopNodes();
  }

  private findLoopEnd(element: FlowNode): string {
    return (element.element as any)?.noMoreValuesConnector?.targetReference ?? element.name;
  }

  private findStatementsInLoops(flow: Flow, loopElements: FlowNode[]): FlowNode[] {
    const statementsInLoops: FlowNode[] = [];
    const statementTypes = this.getStatementTypes();
    for (const element of loopElements) {
      const loopElems = flow.graph.getLoopElements(element.name);
      for (const elemName of loopElems) {
        const node = flow.graph.getNode(elemName);
        if (node && statementTypes.includes(node.subtype)) {
          statementsInLoops.push(node);
        }
      }
    }
    return statementsInLoops;
  }

  /**
   * Find subflows called from within loops and check if they contain violating statements.
   * Recursively checks nested subflow chains.
   * Uses synchronous resolution via getSync().
   */
  private findStatementsInSubflowsSync(
    flow: Flow,
    loopElements: FlowNode[],
    resolver: SubflowResolver
  ): SubflowViolation[] {
    const violations: SubflowViolation[] = [];

    // Check if resolver supports synchronous access
    if (!resolver.getSync) {
      return violations;
    }

    for (const loopElement of loopElements) {
      const loopElems = flow.graph.getLoopElements(loopElement.name);

      for (const elemName of loopElems) {
        const node = flow.graph.getNode(elemName);
        if (!node || node.subtype !== "subflows") continue;

        const subflowName = node.flowName;
        if (!subflowName) continue;

        // Walk this subflow and its nested subflows for violating statements,
        // always reporting on the original subflow call node in the loop.
        walkSubflowChainSync<null>(
          resolver,
          { flowName: subflowName, payload: null },
          (childFlow, _payload, chain) =>
            this.collectSubflowViolations(childFlow, chain, node, violations)
        );
      }
    }

    return violations;
  }

  /**
   * Walk callback for one resolved subflow: record its violating statements
   * and continue into its nested subflow calls.
   */
  private collectSubflowViolations(
    childFlow: Flow,
    chain: string[],
    originalSubflowNode: FlowNode,
    violations: SubflowViolation[]
  ): SubflowWalkStep<null>[] {
    const statementTypes = this.getStatementTypes();
    const nested: SubflowWalkStep<null>[] = [];

    for (const childElement of childFlow.elements) {
      if (!(childElement instanceof FlowNode)) continue;

      if (statementTypes.includes(childElement.subtype)) {
        violations.push({
          subflowNode: originalSubflowNode,
          violatingNode: childElement,
          childFlow: childFlow,
          callChain: chain.length > 1 ? chain : undefined,
        });
      }

      if (childElement.subtype === "subflows" && childElement.flowName) {
        nested.push({ flowName: childElement.flowName, payload: null });
      }
    }

    return nested;
  }
}