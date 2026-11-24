import * as core from "../internals/internals";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { RuleCommon } from "../models/RuleCommon";

export const DUPLICATE_FLOW_LOGIC_RULE_ID = "duplicate-flow-logic";

/**
 * Cross-flow check. check() stays empty because one flow cannot see the others.
 * ScanFlows fills the violations after every flow in the scan has been read.
 */
export class DuplicateFlowLogic extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      ruleId: DUPLICATE_FLOW_LOGIC_RULE_ID,
      category: "suggestion",
      name: "DuplicateFlowLogic",
      label: "Duplicate Flow Logic",
      description:
        "The same stretch of logic appears in more than one place. Element names, labels, and canvas positions are ignored. Extract the shared chain into a subflow.",
      summary: "The same logic appears in more than one flow",
      supportedTypes: core.FlowType.allTypes(),
      docRefs: [],
    });
  }

  protected check(
    _flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    return [];
  }
}
