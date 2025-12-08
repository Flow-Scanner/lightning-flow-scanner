import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class FlowName extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      description:
        "The readability of a flow is of utmost importance. Establishing a naming convention for the Flow Name significantly enhances findability, searchability, and maintains overall consistency. It is advisable to include at least a domain and a brief description of the actions carried out in the flow, for instance, 'Service_OrderFulfillment'.",
      docRefs: [
        {
          label: "Naming your Flows is more critical than ever. By Stephen Church",
          path: "https://www.linkedin.com/posts/stephen-n-church_naming-your-flows-this-is-more-critical-activity-7099733198175158274-1sPx",
        },
      ],
      label: "Flow Naming Convention",
      name: "FlowName",
      supportedTypes: core.FlowType.allTypes(),
    }, { severity: "error" });
  }

  protected check(
    flow: core.Flow,
    options: { expression?: string } | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    const rawRegexp = options?.expression ?? "[A-Za-z0-9]+_[A-Za-z0-9]+";
    const flowName = flow.name ?? "";

    if (new RegExp(rawRegexp).test(flowName)) {
      return [];
    }

    return [
      new core.Violation(
        new core.FlowAttribute(flowName, "name", rawRegexp)
      )
    ];
  }
}