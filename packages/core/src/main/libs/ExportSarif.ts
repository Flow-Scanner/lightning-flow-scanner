import { Flow } from "../models/Flow";
import { ScanResult } from "../models/ScanResult";
import { Violation } from "../models/Violation";

export function exportSarif(results: ScanResult[]): string {
  const runs = results.map((result) => {
    const flow = result.flow;
    const uri = getUri(flow);
    return {
      artifacts: [{ location: { uri }, sourceLanguage: "xml" }],
      results: result.ruleResults
        .filter(r => r.occurs)
        .flatMap(r => r.details.map(d => ({
          level: mapSeverity(r.severity),
          locations: [{
            physicalLocation: {
              artifactLocation: { index: 0, uri },
              region: mapRegion(d)
            },
          }],
          message: { text: r.errorMessage || `${r.ruleName} in ${d.name}` },
          properties: {
            element: d.name,
            flow: flow.name,
            type: d.type,
            ...d.details,
          },
          ruleId: r.ruleName,
        }))),
      tool: {
        driver: {
          informationUri: "https://github.com/Flow-Scanner/lightning-flow-scanner",
          name: "Lightning Flow Scanner",
          rules: result.ruleResults
            .filter(r => r.occurs)
            .map(r => ({
              defaultConfiguration: { level: mapSeverity(r.severity) },
              fullDescription: { text: r.ruleDefinition.description || "" },
              id: r.ruleName,
              shortDescription: { text: r.ruleDefinition.description || r.ruleName },
            })),
          version: "1.0.0",
        },
      },
    };
  });
  return JSON.stringify({
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs,
    version: "2.1.0",
  }, null, 2);
}

function getUri(flow: Flow): string {
  // Prefer uri (works in both browser and Node)
  if (flow.uri) {
    return flow.uri.replace(/\\/g, "/");
  }
  
  // Node only: fsPath is only set in Node environments
  if (flow.fsPath) {
    const match = flow.fsPath.match(/(?:force-app|src)\/.+$/);
    if (match) {
      return match[0].replace(/\\/g, "/");
    }
    return flow.fsPath.replace(/\\/g, "/");
  }
  
  return `flows/${flow.name}.flow-meta.xml`;
}

function mapRegion(detail: Violation): any {
  // Use pre-enriched line/column from Violation (added by enrichViolationsWithLineNumbers)
  // Fallback if somehow missing (e.g., unenriched legacy data)
  return {
    startColumn: detail.columnNumber ?? 1,
    startLine: detail.lineNumber ?? 1,
  };
}

function mapSeverity(sev: string): "error" | "note" | "warning" {
  switch (sev?.toLowerCase()) {
    case "info":
    case "note": return "note";
    case "warning": return "warning";
    default: return "warning";
  }
}