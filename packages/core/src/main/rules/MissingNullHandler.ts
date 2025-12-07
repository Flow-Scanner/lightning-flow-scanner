import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
export class MissingNullHandler extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      description:
        "When a Get Records operation doesn't find any data, it returns null. To ensure data validation, utilize a decision element on the operation result variable to check for a non-null result.",
      docRefs: [],
      label: "Missing Null Handler",
      name: "MissingNullHandler",
      supportedTypes: [...core.FlowType.backEndTypes, ...core.FlowType.visualTypes],
    });
  }
  protected check(
    flow: core.Flow,
    _options: object | undefined,
    suppressions: Set<string>
  ): core.Violation[] {
    const getOperations = ["recordLookups"];
    const getOperationElements: core.FlowNode[] = flow.elements.filter(
      (node) => node.metaType === "node" && getOperations.includes(node.subtype)
    ) as core.FlowNode[];
    const decisionElements: core.FlowNode[] = flow.elements.filter(
      (node) => node.metaType === "node" && node.subtype === "decisions"
    ) as core.FlowNode[];
    const violations: core.FlowNode[] = [];
    for (const getElement of getOperationElements) {
      if (suppressions.has(getElement.name)) continue;
      const elementName = getElement.name;
      const assignNulls = String(getElement.element["assignNullValuesIfNoRecordsFound"]).toLowerCase() === "true";
      if (!assignNulls) continue;
      const hasFaultConnector =
        !!getElement.element["faultConnector"] ||
        getElement.connectors?.some((c) => c.type === "faultConnector");
      if (hasFaultConnector) continue;
      const resultReferences: string[] = [];
      if (getElement.element["storeOutputAutomatically"]) {
        resultReferences.push(elementName);
      } else if (getElement.element["outputReference"]) {
        resultReferences.push(getElement.element["outputReference"] as string);
      } else if (getElement.element["outputAssignments"]) {
        const assignments = getElement.element["outputAssignments"] as any[];
        for (const a of assignments) {
          resultReferences.push(a.assignToReference);
        }
      }
      const resultIsUsed = flow.elements.some((el) => {
        if (el.name === getElement.name) return false;
        const json = JSON.stringify(el.element);
        return resultReferences.some(
          (ref) => json.includes(`"${ref}"`) || json.includes(`"${ref}.`)
        );
      });
      if (!resultIsUsed) continue;
      let nullCheckFound = false;
      for (const decision of decisionElements) {
        let rules = decision.element["rules"];
        if (!Array.isArray(rules)) rules = [rules];
        for (const rule of rules) {
          let conditions = rule.conditions;
          if (!Array.isArray(conditions)) conditions = [conditions];
          for (const condition of conditions) {
            let referenceFound = false;
            let isNullOperator = false;
            let checksFalse = false;
            if (condition.leftValueReference) {
              const ref = condition.leftValueReference as string;
              if (resultReferences.some((r) => ref.startsWith(r))) {
                referenceFound = true;
              }
            }
            if (condition.operator === "IsNull") {
              isNullOperator = true;
            }
            const rightBool = condition.rightValue?.booleanValue;
            if (rightBool != null && String(rightBool).toLowerCase() === "false") {
              checksFalse = true;
            }
            if (referenceFound && isNullOperator && checksFalse) {
              nullCheckFound = true;
              break;
            }
          }
          if (nullCheckFound) break;
        }
        if (nullCheckFound) break;
      }
      if (!nullCheckFound) {
        violations.push(getElement);
      }
    }
    return violations.map((det) => new core.Violation(det));
  }
}