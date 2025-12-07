import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";

export class MissingMetadataDescription extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      description: "Every element must have a meaningful description",
      docRefs: [],
      label: "Missing Metadata Description",
      name: "MissingMetadataDescription",
      supportedTypes: core.FlowType.allTypes(),
    });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppression: Set<string>
  ): core.Violation[] {
    const violations: core.Violation[] = [];

    flow.elements
      .filter((elem) => {
        if (
          elem.metaType !== "metadata" &&
          !elem.element["description"] &&
          elem.subtype !== "start"
        ) {
          return elem;
        }
      })
      .forEach((elem) => {
        return violations.push(new core.Violation(elem));
      });

    return violations;
  }
}
