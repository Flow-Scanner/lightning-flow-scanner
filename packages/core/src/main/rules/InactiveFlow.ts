import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class InactiveFlow extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "InactiveFlow",
      label: "Inactive Flow",
      description:
        "Like cleaning out your closet: deleting unused flows is essential. Inactive flows can still cause trouble, like accidentally deleting records during testing, or being activated as subflows within parent flows.",
      supportedTypes: core.FlowType.allTypes(),
      docRefs: [],
    });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    if (flow.status !== "Active") {
      return [
        new core.Violation(
          new core.FlowAttribute(flow.status, "status", "!= Active")
        ),
      ];
    }
    return [];
  }
}
