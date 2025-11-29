import { FlatViolation } from "../models/FlatViolation";
import { ScanResult } from "../models/ScanResult";
import { Violation } from "../models/Violation";

export function exportDetails(results: ScanResult[], includeDetails = false): FlatViolation[] {
  return results.flatMap(result => {
    const flow = result.flow;
    const flowName = flow.label || flow.name;
    const flowFile = flow.fsPath ? flow.fsPath.replace(/\\/g, "/") : `${flow.name}.flow-meta.xml`;
    return result.ruleResults
      .filter(rule => rule.occurs && rule.details?.length)
      .flatMap(rule => rule.details.map(detail => {
        // Exclude details by default (via Omit), add conditionally
        const base = detail as Omit<Violation, 'details'>;
        const exported: FlatViolation = {
          ...base,  // Core props + lines + violation (no details)
          ...(includeDetails && detail.details ? { details: detail.details } : {}),  // Opt-in only
          flowFile,
          flowName,
          ruleName: rule.ruleDefinition.label || rule.ruleName,  // TODO: replace with id
          severity: rule.severity ?? "error",
        };
        return exported;
      }));
  });
}