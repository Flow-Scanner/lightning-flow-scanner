import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class MissingFilterRecordTrigger extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "MissingFilterRecordTrigger",
      label: "Missing Record Trigger Filter",
      description:
        "Detects record-triggered flows that lack filters on changed fields or entry conditions, leading to unnecessary executions on every record change. This can degrade system performance, hit governor limits faster, and increase resource consumption in high-volume orgs.",
      supportedTypes: [core.FlowType.autolaunchedType],
      docRefs: [],
    });
  }

  protected check(
  flow: core.Flow,
  _options: object | undefined,
  _suppressions: Set<string>
): core.Violation[] {
  const violations: core.Violation[] = [];
  // Check if this is a record-triggered flow
  const triggerType = flow.xmldata?.start?.triggerType;
  // Only check flows with record trigger types
  if (!triggerType || !["RecordAfterSave", "RecordBeforeSave"].includes(triggerType)) {
    return violations;
  }
  // Check if the flow has filters or entry conditions at the flow level
  const filters = flow.xmldata?.start?.filters;
  const hasFilters = !!filters;
  const scheduledPaths = flow.xmldata?.start?.scheduledPaths;
  const hasScheduledPaths = !!scheduledPaths;
  // If no filters or scheduled paths (which have their own conditions), flag as violation
  if (!hasFilters && !hasScheduledPaths) {
    violations.push(
      new core.Violation(
        new core.FlowAttribute(
          triggerType,
          "triggerType",
          "autolaunched && triggerType"
        )
      )
    );
  }
  return violations;
}
}