import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
export class CopyAPIName extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "CopyAPIName",
      label: "Copy API Name",
      description:
        "Maintaining multiple elements with a similar name, like 'Copy_X_Of_Element,' can diminish the overall readability of your Flow. When copying and pasting these elements, it's crucial to remember to update the API name of the newly created copy.",
      supportedTypes: core.FlowType.allTypes(),
      docRefs: [],
    });
  }
  protected check(
  flow: core.Flow
): core.Violation[] {
  const flowElements = flow.elements.filter(
    (node) => node instanceof core.FlowNode
  ) as core.FlowNode[];

  const copyOfElements = flowElements.filter(el =>
    /Copy_[0-9]+_of_[A-Za-z0-9]+/.test(el.name)
  );

  return copyOfElements.map(el => new core.Violation(el));
}

}