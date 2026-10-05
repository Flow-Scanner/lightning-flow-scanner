import { Flow, FlowNode, Violation } from "../internals/internals";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { FlowType } from "../models/FlowType";
import { RuleCommon } from "../models/RuleCommon";
import { SubflowResolver } from "../libs/SubflowResolver";

interface UnresolvedSubflowOptions {
  subflowResolver?: SubflowResolver;
  [key: string]: unknown;
}

/**
 * System rule that detects subflow references that cannot be resolved.
 *
 * This is a "system" category rule - it catches issues that the Flow Builder UI
 * prevents by default, but can occur when XML is edited directly (by AI, scripts, etc.)
 *
 * System rules:
 * - Are not documented in the main README
 * - Are opt-in: enable with `systemRules: true`
 * - Only valuable when XML files are edited outside Flow Builder
 */
export class UnresolvedSubflow extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      ruleId: "unresolved-subflow",
      category: "system",
      description:
        "Detects subflow references that cannot be resolved. This may indicate a missing flow, " +
        "a typo in the flow name, or a reference to a managed package flow that is not accessible. " +
        "This rule requires a SubflowResolver to be configured.",
      summary: "Subflow reference cannot be resolved",
      docRefs: [],
      label: "Unresolved Subflow Reference",
      name: "UnresolvedSubflow",
      supportedTypes: [...FlowType.backEndTypes, ...FlowType.visualTypes],
    }, { severity: "error" });
  }

  protected check(
    flow: Flow,
    options: UnresolvedSubflowOptions | undefined,
    suppressions: Set<string>
  ): Violation[] {
    const resolver = options?.subflowResolver;

    // This rule only runs when a resolver is provided
    if (!resolver) {
      return [];
    }

    const violations: Violation[] = [];
    const subflowNodes = flow.getSubflowNodes();

    for (const node of subflowNodes) {
      if (suppressions.has(node.name)) continue;

      const subflowName = node.flowName;
      if (!subflowName) {
        // Missing flowName attribute - definitely an error
        const violation = new Violation(node);
        violation.description = "Subflow element is missing the flowName attribute";
        violations.push(violation);
        continue;
      }

      // Managed-package subflows (ns__FlowName) live in the installed package,
      // not in local source — resolvers can't see them, so absence is expected
      // and not an error. Same naming convention as FileSystemResolver.
      if (subflowName.includes("__")) continue;

      // Check if the subflow can be resolved
      if (!resolver.has(subflowName)) {
        const violation = new Violation(node);
        violation.referencedFlow = subflowName;
        violation.description = `Referenced flow "${subflowName}" could not be found`;
        violations.push(violation);
      }
    }

    return violations;
  }
}
