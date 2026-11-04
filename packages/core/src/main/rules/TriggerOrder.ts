import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class TriggerOrder extends RuleCommon implements IRuleDefinition {

  constructor() {
    super(
      {
        ruleId: "unspecified-trigger-order",
        category: "suggestion",
        name: "TriggerOrder",
        label: "Missing Trigger Order",
        description: "Record-triggered Flows without a specified Trigger Order may execute in an unpredictable sequence. Setting a Trigger Order ensures your Flows run in the intended order.",
        summary: "Trigger Order ensures predictable execution sequence",
        supportedTypes: [core.FlowType.autolaunchedType],
        docRefs: [
          {
            label: "Learn more about flow ordering orchestration",
            path: "https://architect.salesforce.com/decision-guides/trigger-automation#Ordering___Orchestration",
          },
        ],
      },
      { severity: "note" }
    );
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {

    // triggerOrder applies only to record-triggered flows. Platform-event flows
    // also set start.object (the event name) but cannot configure an order.
    const triggerType = this.getStartProperty(flow, "triggerType");
    const isRecordTriggered =
      triggerType === "RecordAfterSave" ||
      triggerType === "RecordBeforeSave" ||
      triggerType === "RecordBeforeDelete";
    if (!isRecordTriggered) {
      return [];
    }

    if (!flow.triggerOrder) {
      return [
        new core.Violation(
          new core.FlowAttribute("TriggerOrder", "TriggerOrder", "10, 20, 30 ...")
        ),
      ];
    }

    return [];
  }
}
