import { RuleInfo } from "./RuleInfo";
import * as core from "../internals/internals";

export abstract class RuleCommon {
  public description: string;
  public docRefs: Array<{ label: string; path: string }> = [];
  public isConfigurable: boolean;
  public label: string;
  public name: string;
  public severity?: string;
  public supportedTypes: string[];
  public suppressionElement?: string;
  public uri?: string;
  
  constructor(info: RuleInfo, optional?: { severity?: string }) {
    this.name = info.name;
    this.supportedTypes = info.supportedTypes;
    this.label = info.label;
    this.description = info.description;
    this.uri = `https://github.com/Lightning-Flow-Scanner/lightning-flow-scanner/tree/main/src/main/rules/${info.name}.ts`;
    this.docRefs = info.docRefs;

    const checkImpl = (this as any).check;
    if (typeof checkImpl === "function") {
      const source = checkImpl.toString();
      this.isConfigurable = /options[.\?]/.test(source);
    } else {
      this.isConfigurable = false;
    }

    this.severity = optional?.severity ?? "error";
    this.suppressionElement = info.suppressionElement;
  }

  public execute(
    flow: core.Flow,
    options?: object,
    suppressions: string[] = []
  ): core.RuleResult {
    // Wildcard suppression disables entire rule
    if (suppressions.includes("*")) {
      return new core.RuleResult(this as any, []);
    }
    const suppSet = new Set(suppressions);
    let violations = this.check(flow, options, suppSet);
    violations = violations.filter(v => !suppSet.has(v.name));
    return new core.RuleResult(this as any, violations);
  }

  protected abstract check(
    flow: core.Flow,
    options: object | undefined,
    suppressions: Set<string>
  ): core.Violation[];

  protected isSuppressed(name: string, suppressions: Set<string>): boolean {
    return suppressions.has(name);
  }

  /**
   * Get the start node (the special <start> element).
   * This is now stored separately in flow.startNode, not in flow.elements.
   * 
   * @param flow - The Flow instance
   * @returns The start FlowNode or undefined if not found
   */
  protected getStartNode(flow: core.Flow): core.FlowNode | undefined {
    return flow.startNode;
  }

  /**
   * Get the reference name of the first actual element (what the flow starts at).
   * This is the element that comes AFTER the start node.
   * 
   * @param flow - The Flow instance
   * @returns The start reference name or undefined
   */
  protected getStartReference(flow: core.Flow): string | undefined {
    return flow.startReference || undefined;
  }

  /**
   * Find the INDEX of the first actual element in a FlowNode array.
   * Useful for rules that need to iterate by index.
   * 
   * @param flow - The Flow instance
   * @param flowElements - Array of FlowNodes (typically from flow.elements)
   * @returns The index of the starting element, or -1 if not found
   */
  protected findStartIndex(flow: core.Flow, flowElements: core.FlowNode[]): number {
    const startRef = this.getStartReference(flow);
    if (!startRef) {
      return -1;
    }
    return flowElements.findIndex(n => n.name === startRef);
  }

  /**
   * Safely get a property from the start element.
   * 
   * @param flow - The Flow instance
   * @param propertyName - The property to retrieve (e.g., 'triggerType', 'object')
   * @returns The property value or undefined
   */
  protected getStartProperty(flow: core.Flow, propertyName: string): any {
    if (flow.startNode?.element) {
      return (flow.startNode.element as Record<string, unknown>)?.[propertyName];
    }
    return undefined;
  }
}