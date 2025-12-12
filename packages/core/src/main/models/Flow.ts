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
    "steps",
    "subflows",
    "waits",
    "transforms",
    "customErrors",
  ] as const;

  public static readonly RESOURCE_TAGS = ["textTemplates", "stages"] as const;
  public static readonly VARIABLE_TAGS = ["choices", "constants", "dynamicChoiceSets", "formulas", "variables"] as const;

  // Flow elements (excludes legacy start nodes)
  public elements: FlowElement[] = [];

  // Path properties
  public fsPath?: string; // Resolved absolute path (Node.js only)
  public uri?: string;    // Input path (could be relative, absolute, or virtual)

  // Flow metadata
  public label: string = "";
  public interviewLabel?: string;
  public name: string = "unnamed";
  public processMetadataValues?: any;
  public processType: string = "AutoLaunchedFlow";
  public type: string = ""; // Alias for processType (backward compatibility)
  public status: string = "";
  public triggerOrder?: number;

  // Start-related properties
  /**
   * @deprecated Use startNode.element instead. Kept for backward compatibility.
   */
  public start?: any;
  
  /**
   * Direct reference to first element (from XML attribute).
   * Used in newer flows as an alternative to the start element.
   */
  public startElementReference?: string;
  
  /**
   * Computed reference to the first element to execute.
   * This is what rules should use for traversal.
   */
  public startReference?: string;
  
  /**
   * Parsed FlowNode object of the start element.
   * Contains trigger information and connectors.
   * Access start element data via startNode.element
   */
  public startNode?: FlowNode;

  // Legacy/internal
  public root?: any;
  public xmldata: any;

  constructor(path?: string, data?: unknown) {
    if (path) {
      this.uri = path;
      
      if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
        this.fsPath = p.resolve(path);
      }
      
      let flowName = p.basename(p.basename(path), p.extname(path));
      if (flowName.includes(".")) {
        flowName = flowName.split(".")[0];
      }
      this.name = flowName || "unnamed";
    }

    if (data) {
      const hasFlowElement = typeof data === "object" && data !== null && "Flow" in data;
      if (hasFlowElement) {
        this.xmldata = (data as any).Flow;
      } else {
        this.xmldata = data;
      }
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
    if (!this.xmldata) {
      return;
    }

    // Extract top-level attributes
    this.label = this.xmldata.label || "";
    this.interviewLabel = this.xmldata.interviewLabel;
    this.processType = this.xmldata.processType || "AutoLaunchedFlow";
    this.type = this.processType;
    this.processMetadataValues = this.xmldata.processMetadataValues;
    this.startElementReference = this.xmldata.startElementReference;
    this.status = this.xmldata.status || "Draft";
    this.triggerOrder = this.xmldata.triggerOrder;

    const allNodes: Array<FlowMetadata | FlowNode | FlowVariable | FlowResource> = [];

    for (const nodeType in this.xmldata) {
      // Skip xmlns and attributes
      if (nodeType.startsWith("@_") || nodeType === "@xmlns") {
        continue;
      }

      const data = this.xmldata[nodeType];

      // Handle start nodes separately - store in startNode, don't add to elements
      if (nodeType === "start") {
        if (Array.isArray(data) && data.length > 0) {
          this.startNode = new FlowNode(data[0].name || "start", "start", data[0]);
        } else if (!Array.isArray(data)) {
          this.startNode = new FlowNode(data.name || "start", "start", data);
        }
        continue; // Don't add to elements array
      }

      // Process other node types
      if (Flow.ATTRIBUTE_TAGS.includes(nodeType as any)) {
        this.processNodeType(data, nodeType, allNodes, FlowMetadata);
      } else if (Flow.VARIABLE_TAGS.includes(nodeType as any)) {
        this.processNodeType(data, nodeType, allNodes, FlowVariable);
      } else if (Flow.NODE_TAGS.includes(nodeType as any)) {
        this.processNodeType(data, nodeType, allNodes, FlowNode);
      } else if (Flow.RESOURCE_TAGS.includes(nodeType as any)) {
        this.processNodeType(data, nodeType, allNodes, FlowResource);
      }
    }

    this.elements = allNodes;
    this.startReference = this.findStart();
  }

  private processNodeType<T extends FlowElement>(
    data: any,
    nodeType: string,
    allNodes: FlowElement[],
    NodeClass: new (name: string, subtype: string, data: any) => T
  ) {
    if (Array.isArray(data)) {
      for (const node of data) {
        allNodes.push(new NodeClass(node.name, nodeType, node));
      }
    } else {
      allNodes.push(new NodeClass(data.name, nodeType, data));
    }
  }

  /**
   * Find the name of the first element to execute.
   * Priority order:
   * 1. startElementReference (newer flows, direct XML attribute)
   * 2. Start node connector (older flows, points to first element)
   * 3. Start node scheduledPaths (async flows)
   */
  private findStart(): string {
    // Priority 1: Explicit startElementReference
    if (this.startElementReference) {
      return this.startElementReference;
    }

    // Priority 2: Start node with regular connector
    if (this.startNode && this.startNode.connectors && this.startNode.connectors.length > 0) {
      const connector = this.startNode.connectors[0];
      if (connector.reference) {
        return connector.reference;
      }
    }

    // Priority 3: Start node with scheduledPaths (async flows)
    if (this.startNode?.element) {
      const scheduledPaths = this.startNode.element['scheduledPaths'];
      if (scheduledPaths) {
        const paths = Array.isArray(scheduledPaths) ? scheduledPaths : [scheduledPaths];
        if (paths.length > 0 && paths[0]?.connector) {
          const targetRef = paths[0].connector.targetReference;
          if (targetRef) {
            return targetRef;
          }
        }
      }
    }

    // No valid start found
    return "";
  }

  public toXMLString(): string {
    try {
      return this.generateDoc();
    } catch (exception) {
      const errorMsg = exception instanceof Error ? exception.message : String(exception);
      console.warn(`Unable to write xml, caught an error: ${errorMsg}`);
      return "";
    }
  }

  private generateDoc(): string {
    const flowXmlNamespace = "http://soap.sforce.com/2006/04/metadata";
    const builderOptions = {
      attributeNamePrefix: "@_",
      format: true,
      ignoreAttributes: false,
      suppressBooleanAttributes: false,
      suppressEmptyNode: false
    };

    const builder = new XMLBuilder(builderOptions);
    const xmldataWithNs = { ...this.xmldata };

    if (!xmldataWithNs["@_xmlns"]) {
      xmldataWithNs["@_xmlns"] = flowXmlNamespace;
    }

    if (!xmldataWithNs["@_xmlns:xsi"]) {
      xmldataWithNs["@_xmlns:xsi"] = "http://www.w3.org/2001/XMLSchema-instance";
    }

    const rootObj = { Flow: xmldataWithNs };
    return builder.build(rootObj);
  }
}