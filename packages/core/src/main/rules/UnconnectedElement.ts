
import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class UnconnectedElement extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      description:
        "To maintain the efficiency and manageability of your Flow, it's best to avoid including unconnected elements that are not in use.",
      docRefs: [],
      label: "Unconnected Element",
      name: "UnconnectedElement",
      supportedTypes: [...core.FlowType.backEndTypes, ...core.FlowType.visualTypes],
    });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    suppressions: Set<string>
  ): core.Violation[] {
    const connectedElements: Set<string> = new Set<string>();
    
    const logConnected = (element: core.FlowNode) => {
      connectedElements.add(element.name);
    };

    const flowElements: core.FlowNode[] = flow.elements.filter(
      (node): node is core.FlowNode => node instanceof core.FlowNode
    );

    // Use the helper to get the start reference
    const startRef = this.getStartReference(flow);
    if (startRef) {
      new core.Compiler().traverseFlow(flow, startRef, logConnected);
    }

    const unconnectedElements: core.FlowNode[] = flowElements.filter(
      (element) => !connectedElements.has(element.name) && !suppressions.has(element.name)
    );

    return unconnectedElements.map((det) => new core.Violation(det));
  }
}