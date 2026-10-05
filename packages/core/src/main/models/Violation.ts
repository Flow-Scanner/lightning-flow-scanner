import { MetaType } from "../enums/MetadataTypes";
import { Flow } from "./Flow";
import { FlowAttribute } from "./FlowAttribute";
import { FlowElement } from "./FlowElement";
import { FlowNode } from "./FlowNode";
import { FlowVariable } from "./FlowVariable";

/**
 * A single rule violation. Deliberately flat: every field lives at the top
 * level with a fixed name and type, whatever kind of element or rule produced
 * it — there is no polymorphic `details` bag. Fields that don't apply to a
 * given violation are simply absent.
 */
export class Violation {
  // Identity — always present
  public name: string;
  public type: string;          // Element subtype (e.g. recordUpdates, variables)
  public metaType: string;      // node | variable | attribute | resource

  // Position in the flow XML — mandatory post-enrich; defaults to 1 if not found
  public lineNumber: number;
  public columnNumber: number;

  // Element facts — set when the element kind carries them
  public dataType?: string;     // variables
  public connectsTo?: string[]; // nodes: connector targets
  public locationX?: string;    // nodes: canvas position
  public locationY?: string;
  public expression?: string;   // flow-level attributes

  // Rule context — one shared vocabulary across all rules
  public description?: string;       // Human explanation of this occurrence
  public referencedFlow?: string;    // Subflow API name involved (cross-flow findings)
  public referencedElement?: string; // Element inside the referenced flow
  public referencedType?: string;    // Subtype of that element
  public callChain?: string[];       // Chain of flow names for cross-flow findings
  public taintedVariables?: string[];
  public sinkType?: string;          // Element subtype acting as the data sink

  constructor(violation: FlowElement) {
    this.name = violation.name;
    this.metaType = violation.metaType;
    this.type = violation.subtype;
    this.lineNumber = 1;         // Default; will be overwritten by enrich if found
    this.columnNumber = 1;       // Default; will be overwritten by enrich if found

    if (violation.metaType === MetaType.VARIABLE) {
      const element = violation as FlowVariable;
      this.dataType = element.dataType;
    } else if (violation.metaType === MetaType.NODE) {
      const element = violation as FlowNode;
      this.connectsTo = element.connectors?.map((connector) => connector.reference);
      this.locationX = element.locationX;
      this.locationY = element.locationY;
    } else if (violation.metaType === MetaType.ATTRIBUTE) {
      const element = violation as FlowAttribute;
      this.expression = element.expression;
    }
  }
}

/** Optional fields removed at DetailLevel.SIMPLE (identity/position remain). */
const DETAIL_FIELDS = [
  "dataType",
  "connectsTo",
  "locationX",
  "locationY",
  "expression",
  "description",
  "referencedFlow",
  "referencedElement",
  "referencedType",
  "callChain",
  "taintedVariables",
  "sinkType",
] as const;

export function stripViolationDetails(violation: Violation): void {
  for (const field of DETAIL_FIELDS) {
    delete violation[field];
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
    if (violation.metaType !== MetaType.ATTRIBUTE) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`<name>${violation.name}</name>`)) {
          violation.lineNumber = i + 1;
          violation.columnNumber = lines[i].indexOf(violation.name) + 1;
          break;
        }
      }
    }
    // For flow-level attributes, search by the XML tag if it exists
    if (violation.metaType === MetaType.ATTRIBUTE) {
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