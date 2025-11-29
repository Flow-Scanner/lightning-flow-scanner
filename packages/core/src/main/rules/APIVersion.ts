import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class APIVersion extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "APIVersion",
      label: "Outdated API Version",
      description:
        "Introducing newer API components may lead to unexpected issues with older versions of Flows, as they might not align with the underlying mechanics. Starting from API version 50.0, the 'Api Version' attribute has been readily available on the Flow Object. To ensure smooth operation and reduce discrepancies between API versions, it is strongly advised to regularly update and maintain them.",
      supportedTypes: core.FlowType.allTypes(),
      docRefs: [],
      isConfigurable: true,
      autoFixable: false,
    });
  }

  protected check(
  flow: core.Flow,
  options: { expression?: string } | undefined,
  _suppressions: Set<string>
): core.Violation[] {

  let flowAPIVersionNumber: number | null = null;
  if (flow.xmldata.apiVersion) {
    flowAPIVersionNumber = +flow.xmldata.apiVersion;
  }

  // No API version
  if (!flowAPIVersionNumber) {
    return [
      new core.Violation(
        new core.FlowAttribute("API Version <49", "apiVersion", "<49")
      )
    ];
  }

  // Custom logic
  if (options?.expression) {
    const isValid = new Function(
      `return ${flowAPIVersionNumber}${options.expression};`
    )();
      
    if (!isValid) {
      return [
        new core.Violation(
          new core.FlowAttribute(
            `${flowAPIVersionNumber}`,
            "apiVersion",
            options.expression
          )
        )
      ];
    }
  }

  return [];
}

}