import { FlowElement } from "./FlowElement";

export class FlowResource extends FlowElement {
  public name: string;

  constructor(name: string, subtype: string, element: object) {
    super("resource", subtype, element);
    this.name = name;
  }
}
