import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class UnusedVariable extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "UnusedVariable",
      label: "Unused Variable",
      description:
        "To maintain the efficiency and manageability of your Flow, it's advisable to avoid including unconnected variables that are not in use.",
      supportedTypes: [...core.FlowType.backEndTypes, ...core.FlowType.visualTypes],
      docRefs: [],
      isConfigurable: false,
      autoFixable: true,
    });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    const variables = flow.elements.filter(
      (node) => node instanceof core.FlowVariable
    ) as core.FlowVariable[];

    const unusedVariables: core.FlowVariable[] = [];

    for (const variable of variables) {
      const variableName = variable.name;

      const nodeMatches = [
        ...JSON.stringify(flow.elements.filter((node) => node instanceof core.FlowNode)).matchAll(
          new RegExp(variableName, "gi")
        ),
      ].map((a) => a.index);

      if (nodeMatches.length > 0) continue;

      const resourceMatches = [
        ...JSON.stringify(flow.elements.filter((node) => node instanceof core.FlowResource)).matchAll(
          new RegExp(variableName, "gi")
        ),
      ].map((a) => a.index);

      if (resourceMatches.length > 0) continue;

      const insideCounter = [
        ...JSON.stringify(variable).matchAll(new RegExp(variable.name, "gi")),
      ].map((a) => a.index);

      const variableUsage = [
        ...JSON.stringify(flow.elements.filter((node) => node instanceof core.FlowVariable)).matchAll(
          new RegExp(variableName, "gi")
        ),
      ].map((a) => a.index);

      if (variableUsage.length === insideCounter.length) {
        unusedVariables.push(variable);
      }
    }

    return unusedVariables.map((variable) => new core.Violation(variable));
  }
}
