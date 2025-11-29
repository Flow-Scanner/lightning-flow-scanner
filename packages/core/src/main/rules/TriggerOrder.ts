import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class TriggerOrder extends RuleCommon implements IRuleDefinition {
  protected qualifiedRecordTriggerTypes: Set<string> = new Set<string>(["Create", "Update"]);

  constructor() {
    super(
      {
        name: "TriggerOrder",
        label: "Trigger Order",
        description:
          "With flow trigger ordering, introduced in Spring '22, admins can now assign a priority value to their flows and guarantee their execution order. This priority value is not an absolute value, so the values need not be sequentially numbered as 1, 2, 3, and so on.",
        supportedTypes: [core.FlowType.autolaunchedType],
        docRefs: [
          {
            label: "Learn more about flow ordering orchestration",
            path: "https://architect.salesforce.com/decision-guides/trigger-automation#Ordering___Orchestration",
          },
        ],
        isConfigurable: false,
        autoFixable: false,
      },
      { severity: "note" }
    );
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    if (!("object" in flow.start)) return [];

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
