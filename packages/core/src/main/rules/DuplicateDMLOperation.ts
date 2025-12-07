import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
export class DuplicateDMLOperation extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "DuplicateDMLOperation",
      label: "Duplicate DML Operation",
      description:
        "When the flow executes database changes or actions between two screens, it's important to prevent users from navigating back between screens. Failure to do so may result in duplicate database operations being performed within the flow.",
      supportedTypes: core.FlowType.visualTypes,
      docRefs: [],
    });
  }
  protected check(
    flow: core.Flow,
    _options: object | undefined,
    suppressions: Set<string>
  ): core.Violation[] {
    const flowElements: core.FlowNode[] = flow.elements.filter(
      (node) => node instanceof core.FlowNode
    ) as core.FlowNode[];
    const processedElementIndexes: number[] = [];
    const unconnectedElementIndexes: number[] = [];
    const DuplicateDMLOperations: core.FlowNode[] = [];
    const startingNode = this.findStart(flow);
    if (startingNode === -1) {
      return [];
    }
    let dmlFlag = false;
    let indexesToProcess = [startingNode];
    do {
      indexesToProcess = indexesToProcess.filter(
        (index) => !processedElementIndexes.includes(index)
      );
      if (indexesToProcess.length > 0) {
        for (const [index, element] of flowElements.entries()) {
          if (indexesToProcess.includes(index)) {
            const references: string[] = [];
            if (element.connectors && element.connectors.length > 0) {
              for (const connector of element.connectors) {
                if (connector.reference) {
                  references.push(connector.reference);
                }
              }
            }
            dmlFlag = this.flagDML(element, dmlFlag);
            if (references.length > 0) {
              const elementsByReferences = flowElements.filter((el) =>
                references.includes(el.name)
              );
              for (const nextElement of elementsByReferences) {
                const nextIndex = flowElements.findIndex(
                  (el) => nextElement.name === el.name
                );
                if (nextElement.subtype === "screens") {
                  if (
                    dmlFlag &&
                    nextElement.element["allowBack"] === "true" &&
                    nextElement.element["showFooter"] === "true"
                  ) {
                    if (!suppressions.has(nextElement.name)) {
                      DuplicateDMLOperations.push(nextElement);
                    }
                  }
                }
                if (!processedElementIndexes.includes(nextIndex)) {
                  indexesToProcess.push(nextIndex);
                }
              }
            }
            processedElementIndexes.push(index);
          }
        }
      } else {
        for (const index of flowElements.keys()) {
          if (!processedElementIndexes.includes(index)) {
            unconnectedElementIndexes.push(index);
          }
        }
      }
    } while (
      processedElementIndexes.length + unconnectedElementIndexes.length <
      flowElements.length
    );
    return DuplicateDMLOperations.map(
      (det) => new core.Violation(det)
    );
  }
  private findStart(flow: core.Flow): number {
    const flowElements: core.FlowNode[] = flow.elements.filter(
      (node) => node instanceof core.FlowNode
    ) as core.FlowNode[];
    if (flow.startElementReference) {
      return flowElements.findIndex((n) => n.name === flow.startElementReference);
    } else {
      return flowElements.findIndex((n) => n.subtype === "start");
    }
  }
  private flagDML(element: core.FlowNode, dmlFlag: boolean): boolean {
    const dmlStatementTypes = ["recordDeletes", "recordUpdates", "recordCreates"];
    if (dmlStatementTypes.includes(element.subtype)) {
      return true;
    } else if (
      dmlFlag === true &&
      element.subtype === "screens" &&
      element.element["allowBack"] === "true"
    ) {
      return false;
    } else {
      return dmlFlag;
    }
  }
}