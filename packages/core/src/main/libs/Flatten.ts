import { FlatViolation } from "../models/FlatViolation";
import { ScanResult } from "../models/ScanResult";

/**
 * Flatten scan results to one self-contained record per violation. Lossless:
 * every Violation field carries over, plus flow and rule context. Replaces
 * the pre-v7 exportDetails(), which whitelisted a handful of detail keys.
 */
export function flatten(results: ScanResult[]): FlatViolation[] {
  return results.flatMap(result => {
    const flow = result.flow;
    const flowName = flow.name || flow.label;
    // Prefer fsPath (resolved absolute path), fallback to uri (input path), or construct from name
    const flowFile = flow.fsPath
      ? flow.fsPath.replace(/\\/g, "/")
      : flow.uri
        ? flow.uri.replace(/\\/g, "/")
        : `${flow.name}.flow-meta.xml`;

    return result.ruleResults
      .filter(rule => rule.occurs && rule.details?.length)
      .flatMap(rule => rule.details.map(violation => ({
        ...violation,
        flowFile,
        flowName,
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        severity: rule.severity ?? "warning",
        message: rule.message || rule.ruleDefinition.description,
        messageUrl: rule.messageUrl,
      })));
  });
}
