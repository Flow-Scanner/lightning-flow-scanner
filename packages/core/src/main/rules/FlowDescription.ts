import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class FlowDescription extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      autoFixable: false,
      description:
        "Descriptions play a vital role in documentation. We highly recommend including details about where they are used and their intended purpose.",
      docRefs: [],
      isConfigurable: false,
      label: "Missing Flow Description",
      name: "FlowDescription",
      supportedTypes: [...core.FlowType.backEndTypes, ...core.FlowType.visualTypes],
    });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    if (flow.xmldata?.description) {
      return [];
    }

    return [
      new core.Violation(
        new core.FlowAttribute("undefined", "description", "!==null")
      )
    ];
  }
}