import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class TransformInsteadOfLoop extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "TransformInsteadOfLoop",
      label: "Transform Instead of Loop",
      description:
        "Detects Loop elements that directly connect to Assignment elements. This pattern can often be replaced with the Transform element, which is on average 10x more performant according to Salesforce documentation.",
      supportedTypes: core.FlowType.allTypes(),
      docRefs: [
        {
          label: "Transform Multiple Records - Trailhead",
          path: "https://trailhead.salesforce.com/content/learn/modules/multirecord-elements-and-transforms-in-flows/transform-multiple-records",
        },
      ],
    }, { severity: "error" });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    const violations: core.Violation[] = [];

    // Get all loop elements
    const loops = flow.elements?.filter((e) => e.subtype === "loops") ?? [];

    for (const loop of loops) {
      const loopNode = loop as core.FlowNode;
      
      // Check if the loop's nextValueConnector (the iterative path) leads to an assignment
      const nextValueConnector = loopNode.connectors?.find(
        (connector) => connector.type === "nextValueConnector"
      );

      if (nextValueConnector?.reference) {
        // Find the element that the nextValueConnector points to
        const targetElement = flow.elements?.find(
          (e) => e.name === nextValueConnector.reference
        );

        // Check if the target is an assignment
        if (targetElement?.subtype === "assignments") {
          violations.push(new core.Violation(loopNode));
        }
      }
    }

    return violations;
  }
}