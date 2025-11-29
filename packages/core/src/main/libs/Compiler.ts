import { Flow } from "../models/Flow";
import { FlowNode } from "../models/FlowNode";

export class Compiler {
  public visitedElements: Set<string>;

  constructor() {
    this.visitedElements = new Set<string>();
  }

  traverseFlow(
    flow: Flow,
    startElementName: string,
    visitCallback: (element: FlowNode) => void,
    endElementName?: string
  ) {
    // Iterative Deepening Depth-First Search (IDDFS)
    let elementsToVisit = [startElementName];

    while (elementsToVisit.length > 0) {
      const nextElements: string[] = [];

      for (const elementName of elementsToVisit) {
        if (!this.visitedElements.has(elementName)) {
          const currentElement = flow.elements?.find(
            (element) => element.name === elementName
          ) as FlowNode;
          if (currentElement) {
            visitCallback(currentElement);
            this.visitedElements.add(elementName);
            nextElements.push(...this.findNextElements(flow, currentElement, endElementName));
          }
        }
      }

      if (nextElements.length === 0) {
        // If no more next elements
        break; // Terminate the traversal
      }

      elementsToVisit = nextElements;
    }
  }

  private findNextElements(
    flow: Flow,
    currentElement: FlowNode,
    endElementName?: string
  ): string[] {
    const nextElements: string[] = [];

    if (!currentElement.connectors || currentElement.connectors.length === 0) {
      return nextElements;
    }

    for (const connector of currentElement.connectors) {
      const targetReference =
        connector?.connectorTargetReference?.targetReference ?? connector.reference;
      // Check if the reference exists in the flow elements
      const nextElement = flow.elements?.find(
        (element) => element.metaType === "node" && element.name === targetReference
      );
      if (nextElement && nextElement.metaType === "node" && nextElement.name !== endElementName) {
        nextElements.push(nextElement!.name as string);
      }
    }
    return nextElements;
  }
}
