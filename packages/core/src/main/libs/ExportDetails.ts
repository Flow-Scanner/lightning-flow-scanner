import { FlatViolation } from "../models/FlatViolation";
import { ScanResult } from "../models/ScanResult";

export function exportDetails(results: ScanResult[], includeDetails = false): FlatViolation[] {
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
      .flatMap(rule => rule.details.map(detail => {
        // Base violation without details
        const { details, ...base } = detail;
        
        // Build the flat violation with conditionally flattened details
        const exported: FlatViolation = {
          ...base,
          flowFile,
          flowName,
          ruleName: rule.ruleName,  // Use ruleName (id) instead of label
          severity: rule.severity ?? "warning",
        };

        // Flatten details object into top-level properties if includeDetails is true
        if (includeDetails && details) {
          if ('dataType' in details) {
            exported.dataType = details.dataType as string;
          }
          if ('locationX' in details) {
            exported.locationX = String(details.locationX);
          }
          if ('locationY' in details) {
            exported.locationY = String(details.locationY);
          }
          if ('connectsTo' in details) {
            // Join array into comma-separated string
            exported.connectsTo = Array.isArray(details.connectsTo) 
              ? details.connectsTo.join(', ') 
              : String(details.connectsTo);
          }
          if ('expression' in details) {
            exported.expression = details.expression as string;
          }
        }

        return exported;
      }));
  });
}