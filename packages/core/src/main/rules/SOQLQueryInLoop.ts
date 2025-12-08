import { FlowType, IRuleDefinition } from "../internals/internals";
import { LoopRuleCommon } from "../models/LoopRuleCommon";

export class SOQLQueryInLoop extends LoopRuleCommon implements IRuleDefinition {
  constructor() {
    super({
      description:
        "To prevent exceeding Apex governor limits, it is advisable to consolidate all your SOQL queries at the conclusion of the flow.",
      docRefs: [
        {
          label: "Flow Best Practices",
          path: "https://help.salesforce.com/s/articleView?id=sf.flow_prep_bestpractices.htm&type=5",
        },
      ],
      label: "SOQL Query In A Loop",
      name: "SOQLQueryInLoop",
      supportedTypes: FlowType.backEndTypes,
    }, { severity: "error" });
  }

  protected getStatementTypes(): string[] {
    return ["recordLookups"];
  }
}