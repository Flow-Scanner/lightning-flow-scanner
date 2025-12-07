import * as core from "../internals/internals";
import { BuildFlow } from "./BuildFlow";

export function fix(results: core.ScanResult[]): core.ScanResult[] {
  const newResults: core.ScanResult[] = [];

  for (const result of results) {
    if (!result.ruleResults || result.ruleResults.length === 0) continue;

    const fixables: core.RuleResult[] = result.ruleResults.filter(
      (r) =>
        (r.ruleName === "UnusedVariable" && r.occurs) ||
        (r.ruleName === "UnconnectedElement" && r.occurs)
    );

    if (fixables.length === 0) continue;

    const newFlow = FixFlows(result.flow, fixables);

    const hasRemainingElements = newFlow.elements && newFlow.elements.length > 0;
    if (hasRemainingElements) {
      result.flow = newFlow;
      newResults.push(result);
    }
  }

  return newResults;
}

export function FixFlows(flow: core.Flow, ruleResults: core.RuleResult[]): core.Flow {
  const unusedVariableRes = ruleResults.find((r) => r.ruleName === "UnusedVariable");
  const unusedVariableNames = new Set(
    unusedVariableRes?.details?.map((d) => d.name) ?? []
  );

  const unconnectedElementsRes = ruleResults.find((r) => r.ruleName === "UnconnectedElement");
  const unconnectedElementNames = new Set(
    unconnectedElementsRes?.details?.map((d) => d.name) ?? []
  );

  const nodesToKeep = flow.elements?.filter((node) => {
    switch (node.metaType) {
      case "attribute":
      case "resource":
        return true;
      case "node": {
        const nodeElement = node as core.FlowNode;
        return !unconnectedElementNames.has(nodeElement.name);
      }
      case "variable": {
        const nodeVar = node as core.FlowVariable;
        return !unusedVariableNames.has(nodeVar.name);
      }
      default:
        return false;
    }
  }) ?? [];

  const xmldata = BuildFlow(nodesToKeep);
  return new core.Flow(flow.fsPath, xmldata);
}