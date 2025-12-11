
import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class MissingFaultPath extends RuleCommon implements IRuleDefinition {
  protected applicableElements: string[] = [
    "recordLookups",
    "recordDeletes",
    "recordUpdates",
    "recordCreates",
    "waits",
    "actionCalls",
    "apexPluginCalls",
  ];

  constructor() {
    super({
      description:
        "At times, a flow may fail to execute a configured operation as intended. By default, the flow displays an error message to the user and notifies the admin who created the flow via email. However, you can customize this behavior by incorporating a Fault Path. This rule checks DML operations, actions (Send Email, Quick Actions), and Invocable Apex Actions for proper error handling.",
      docRefs: [
        {
          label: "Flow Best Practices",
          path: "https://help.salesforce.com/s/articleView?id=sf.flow_prep_bestpractices.htm&type=5",
        },
      ],
      label: "Missing Fault Path",
      name: "MissingFaultPath",
      supportedTypes: [...core.FlowType.backEndTypes, ...core.FlowType.visualTypes],
    });
  }

  private isValidSubtype(proxyNode: core.FlowNode): boolean {
    if (!this.applicableElements.includes(proxyNode.subtype)) {
      return false;
    }
    
    if (proxyNode.subtype === "waits") {
      const elementSubtype: string = (proxyNode.element as Record<string, unknown>)?.["elementSubtype"] as string;
      const excludedSubtypes: string[] = ["WaitDuration", "WaitDate"];
      return !excludedSubtypes.includes(elementSubtype);
    }
    
    return true;
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    suppressions: Set<string>
  ): core.Violation[] {
    const compiler = new core.Compiler();
    const results: core.Violation[] = [];
    
    const elementsWhereFaultPathIsApplicable = (
      flow.elements.filter((node) => {
        const proxyNode = node as unknown as core.FlowNode;
        return this.isValidSubtype(proxyNode);
      }) as core.FlowNode[]
    ).map((e) => e.name);

    // Safely check if this is a RecordBeforeSave flow
    const isRecordBeforeSave = this.isRecordBeforeSaveFlow(flow);

    const visitCallback = (element: core.FlowNode) => {
      if (
        !element?.connectors?.find((connector) => connector.type === "faultConnector") &&
        elementsWhereFaultPathIsApplicable.includes(element.name)
      ) {
        if (isRecordBeforeSave && element.subtype === "recordUpdates") {
          return;
        }
        
        if (!this.isPartOfFaultHandlingFlow(element, flow)) {
          if (!suppressions.has(element.name)) {
            results.push(new core.Violation(element));
          }
        }
      }
    };

    const startRef = this.getStartReference(flow);
    if (startRef) {
      compiler.traverseFlow(flow, startRef, visitCallback);
    }

    return results;
  }

  /**
   * Safely determine if this is a RecordBeforeSave flow.
   * Checks the startNode property for trigger type.
   */
  private isRecordBeforeSaveFlow(flow: core.Flow): boolean {
    const startNode = this.getStartNode(flow);
    
    if (startNode?.element) {
      const triggerType = (startNode.element as Record<string, unknown>)?.["triggerType"];
      return triggerType === "RecordBeforeSave";
    }

    // Fallback: check raw start data if startNode is not available
    if (flow.start && typeof flow.start === "object") {
      const triggerType = (flow.start as Record<string, unknown>)?.["triggerType"];
      return triggerType === "RecordBeforeSave";
    }

    return false;
  }

  private isPartOfFaultHandlingFlow(element: core.FlowNode, flow: core.Flow): boolean {
    const flowelements = flow.elements.filter(
      (el): el is core.FlowNode => el instanceof core.FlowNode
    );

    for (const otherElement of flowelements) {
      if (otherElement !== element) {
        if (
          otherElement.connectors?.find(
            (connector) =>
              connector.type === "faultConnector" && 
              connector.reference && 
              connector.reference === element.name
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }
}