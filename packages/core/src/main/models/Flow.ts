import { XMLBuilder } from "fast-xml-parser";
import * as p from "path";
import { FlowElement } from "./FlowElement";
import { FlowMetadata } from "./FlowMetadata";
import { FlowNode } from "./FlowNode";
import { FlowResource } from "./FlowResource";
import { FlowVariable } from "./FlowVariable";

export class Flow {
  /**
   * Metadata Tags of Salesforce Flow Attributes
   */
  public static readonly ATTRIBUTE_TAGS = [
    "description", "apiVersion", "processMetadataValues", "processType",
    "interviewLabel", "label", "status", "runInMode", "startElementReference",
    "isTemplate", "fullName", "timeZoneSidKey",
    "isAdditionalPermissionRequiredToRun", "migratedFromWorkflowRuleName",
    "triggerOrder", "environments", "segment",
  ] as const;
  /**
   * Metadata Tags of Salesforce Flow Nodes
   */
  public static readonly NODE_TAGS = [
    "actionCalls",
    "apexPluginCalls",
    "assignments",
    "collectionProcessors",
    "decisions",
    "loops",
    "orchestratedStages",
    "recordCreates",
    "recordDeletes",
    "recordLookups",
    "recordUpdates",
    "recordRollbacks",
    "screens",
    "start",
    "steps",
    "subflows",
    "waits",
    "transforms",
    "customErrors",
  ] as const;
  public static readonly RESOURCE_TAGS = ["textTemplates", "stages"] as const;
  public static readonly VARIABLE_TAGS = ["choices", "constants", "dynamicChoiceSets", "formulas", "variables"] as const;
  public elements?: FlowElement[];

  public fsPath?: string; //  This is only set in Node.js environments and is the resolved absolute path. In browser environments, it stays undefined.
  public uri?: string;  // This is always set from the constructor's path parameter and represents the input path (could be relative, absolute, or virtual)
  public interviewLabel?: string;
  public label: string;
  public name?: string;
  public processMetadataValues?: any;
  public processType?: string;
  public root?: any;
  public start?: any;
  public startElementReference?: string;
  public startReference?: string;
  public status?: string;
  public triggerOrder?: number;
  public type?: string;
  /**
   * XML to JSON conversion in raw format
   */
  public xmldata: any;

  constructor(path?: string, data?: unknown) {
    if (path) {
      this.uri = path;  // Always set general URI from input (file path or virtual)
      
      // Only resolve fsPath in Node.js environments
      // In browser with polyfills, fsPath stays undefined
      if (typeof process !== 'undefined' && process.cwd) {
        this.fsPath = p.resolve(path);
      }
      
      let flowName = p.basename(p.basename(path), p.extname(path));
      if (flowName.includes(".")) {
        flowName = flowName.split(".")[0];
      }
      this.name = flowName;
    }
    if (data) {
      const hasFlowElement = typeof data === "object" && "Flow" in data;
      if (hasFlowElement) {
        this.xmldata = (data as any).Flow;
      } else this.xmldata = data;
      this.preProcessNodes();
    }
  }

  public static from(obj: Partial<Flow>): Flow {
    if (obj instanceof Flow) {
      return obj;
    }
    const flow = Object.create(Flow.prototype);
    Object.assign(flow, obj);
    if (!flow.toXMLString) {
      flow.toXMLString = () => '';
    }
    return flow;
  }

  public preProcessNodes() {
    this.label = this.xmldata.label;
    this.interviewLabel = this.xmldata.interviewLabel;
    this.processType = this.xmldata.processType;
    this.processMetadataValues = this.xmldata.processMetadataValues;
    this.startElementReference = this.xmldata.startElementReference;
    this.start = this.xmldata.start;
    this.status = this.xmldata.status;
    this.type = this.xmldata.processType;
    this.triggerOrder = this.xmldata.triggerOrder;
    const allNodes: Array<FlowMetadata | FlowNode | FlowVariable> = [];
    for (const nodeType in this.xmldata) {
      // Skip xmlns and attributes
      if (nodeType.startsWith("@_") || nodeType === "@xmlns") {
        continue;
      }
      const data = this.xmldata[nodeType];
      if (Flow.ATTRIBUTE_TAGS.includes(nodeType as any)) {
        if (Array.isArray(data)) {
          for (const node of data) {
            allNodes.push(new FlowMetadata(node.name, nodeType, node));
          }
        } else {
          allNodes.push(new FlowMetadata(data.name, nodeType, data));
        }
      } else if (Flow.VARIABLE_TAGS.includes(nodeType as any)) {
        if (Array.isArray(data)) {
          for (const node of data) {
            allNodes.push(new FlowVariable(node.name, nodeType, node));
          }
        } else {
          allNodes.push(new FlowVariable(data.name, nodeType, data));
        }
      } else if (Flow.NODE_TAGS.includes(nodeType as any)) {
        if (Array.isArray(data)) {
          for (const node of data) {
            allNodes.push(new FlowNode(node.name, nodeType, node));
          }
        } else {
          allNodes.push(new FlowNode(data.name, nodeType, data));
        }
      } else if (Flow.RESOURCE_TAGS.includes(nodeType as any)) {
        if (Array.isArray(data)) {
          for (const node of data) {
            allNodes.push(new FlowResource(node.name, nodeType, node));
          }
        } else {
          allNodes.push(new FlowResource(data.name, nodeType, data));
        }
      }
    }
    this.elements = allNodes;
    this.startReference = this.findStart();
  }

  public toXMLString(): string {
    try {
      return this.generateDoc();
    } catch (exception) {
      console.warn(`Unable to write xml, caught an error ${exception.toString()}`);
      return "";
    }
  }

  private findStart() {
    let start = "";
    const flowElements: FlowNode[] = this.elements!.filter(
      (node) => node instanceof FlowNode
    ) as FlowNode[];
    if (this.startElementReference) {
      start = this.startElementReference;
    } else if (
      flowElements.find((n) => {
        return n.subtype === "start";
      })
    ) {
      const startElement = flowElements.find((n) => {
        return n.subtype === "start";
      });
      start = startElement!.connectors[0]["reference"];
    }
    return start;
  }

  private generateDoc(): string {
    // eslint-disable-next-line sonarjs/no-clear-text-protocols
    const flowXmlNamespace = "http://soap.sforce.com/2006/04/metadata";
    const builderOptions = {
      attributeNamePrefix: "@_",               // Matches parsing (key prefix)
      format: true,                            // Pretty-print (indented; expands empties to </tag>)
      ignoreAttributes: false,                 // Preserve attrs like xmlns
      suppressBooleanAttributes: false,        // NEW: Force ="true" for boolean-like strings (fixes missing value)
      suppressEmptyNode: false                 // Keep empty tags (but doesn't force self-closing in pretty)
    };
    const builder = new XMLBuilder(builderOptions);
    // Fallback: Inject xmlns as attribute if missing
    const xmldataWithNs = { ...this.xmldata };
    if (!xmldataWithNs["@_xmlns"]) {
      xmldataWithNs["@_xmlns"] = flowXmlNamespace;
    }
    // Optional: Add xsi if needed (often in parsed data; test has it in root)
    if (!xmldataWithNs["@_xmlns:xsi"]) {
      xmldataWithNs["@_xmlns:xsi"] = "http://www.w3.org/2001/XMLSchema-instance";
    }
    // Build: Wrap in { Flow: ... }
    const rootObj = { Flow: xmldataWithNs };
    return builder.build(rootObj);
  }
}