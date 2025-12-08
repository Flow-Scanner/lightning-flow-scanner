import { Flow } from "./Flow";
import { FlowAttribute } from "./FlowAttribute";
import { FlowElement } from "./FlowElement";
import { FlowNode } from "./FlowNode";
import { FlowVariable } from "./FlowVariable";

export class Violation {
  public columnNumber: number;  // Mandatory post-enrich; defaults to 1 if not found
  public details?: object;      // Optional; only populated for rule-specific needs
  public lineNumber: number;    // Mandatory post-enrich; defaults to 1 if not found
  public metaType: string;
  public name: string;
  public type: string;

  constructor(violation: FlowElement) {
    this.name = violation.name;
    this.metaType = violation.metaType;
    this.type = violation.subtype;
    this.lineNumber = 1;         // Default; will be overwritten by enrich if found
    this.columnNumber = 1;       // Default; will be overwritten by enrich if found

    // Conditionally populate details only if needed (e.g., via config flag later)
    if (violation.metaType === "variable") {
      const element = violation as FlowVariable;
      this.details = { dataType: element.dataType };
    } else if (violation.metaType === "node") {
      const element = violation as FlowNode;
      this.details = {
        connectsTo: element.connectors?.map((connector) => connector.reference),
        locationX: element.locationX,
        locationY: element.locationY,
      };
    } else if (violation.metaType === "attribute") {
      const element = violation as FlowAttribute;
      this.details = { expression: element.expression };
    }
    // For other metaTypes or if details disabled, remains undefined
  }
}

export function enrichViolationsWithLineNumbers(
  violations: Violation[],
  flowXml: string
): void {
  if (!flowXml || violations.length === 0) return;
  const lines = flowXml.split("\n");
  // Flow-level XML tags (same as Flow.flowMetadata)
  const flowLevelTags = Flow.ATTRIBUTE_TAGS;
  for (const violation of violations) {
    // For flow elements (nodes, variables, resources), search by <name> tag
    if (violation.metaType !== 'attribute') {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`<name>${violation.name}</name>`)) {
          violation.lineNumber = i + 1;
          violation.columnNumber = lines[i].indexOf(violation.name) + 1;
          break;
        }
      }
    }
   
    // For flow-level attributes, search by the XML tag if it exists
    if (violation.metaType === 'attribute') {
      const tagName = violation.type;
     
      // Only search if it's an actual XML tag (type assertion for literal check)
      if (flowLevelTags.includes(tagName as any)) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`<${tagName}>`)) {
            violation.lineNumber = i + 1;
            violation.columnNumber = lines[i].indexOf(`<${tagName}>`) + 1;
            break;
          }
        }
      }
      // If not found, stays at default (1,1)
    }
  }
}