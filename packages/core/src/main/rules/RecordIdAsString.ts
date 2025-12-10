import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class RecordIdAsString extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "RecordIdAsString",
      label: "Record ID as String Instead of Record",
      description:
        "Detects flows using a String variable named 'recordId' as input when they could receive the entire record object instead. Since recent Salesforce releases, record pages and quick actions can pass the complete record, eliminating the need for an additional Get Records query and improving performance.",
      supportedTypes: [
        ...core.FlowType.visualTypes,
        core.FlowType.autolaunchedType,
      ],
      docRefs: [
        {
          label: "Screen Flow Distribution",
          path: "https://help.salesforce.com/s/articleView?id=sf.flow_distribute_screen.htm",
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

  // Skip record-triggered flows - they don't support this pattern
  const isRecordTriggered = 
    flow.start?.triggerType === "RecordAfterSave" || 
    flow.start?.triggerType === "RecordBeforeSave";

  if (isRecordTriggered) {
    return violations;
  }

  // Find input variables named "recordId" (case-insensitive)
  const variables = flow.elements?.filter(
    (e) => e.subtype === "variables"
  ) as core.FlowVariable[];

  for (const variable of variables) {
    const varElement = variable.element as any;
    
    if (
      (varElement.isInput === true || varElement.isInput === "true") &&
      variable.name.toLowerCase() === "recordid" &&
      varElement.dataType === "String"
    ) {
      violations.push(new core.Violation(variable));
    }
  }

  return violations;
}
}