import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class ProcessBuilder extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "ProcessBuilder",
      label: "No Process Builder",
      description:
        "Salesforce is transitioning away from Workflow Rules and Process Builder in favor of Flow. Ensure you're prepared for this transition by migrating your organization's automation to Flow. Refer to official documentation for more information on the transition process and tools available.",
      supportedTypes: core.FlowType.processBuilder,
      docRefs: [
        {
          label: "Process Builder Retirement",
          path: "https://help.salesforce.com/s/articleView?id=000389396&type=1",
        },
      ],
    });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    return [
      new core.Violation(
        new core.FlowAttribute("Workflow", "processType", "== Workflow")
      ),
    ];
  }
}
