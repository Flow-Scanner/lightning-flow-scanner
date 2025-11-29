import { FlowElement } from "./FlowElement";

export class FlowMetadata extends FlowElement {
  constructor(subtype: string, element: object) {
    super("metadata", subtype, element);
  }
}
