import { MetaType } from "../enums/MetadataTypes";
import { FlowElement } from "./FlowElement";

export class FlowAttribute extends FlowElement {
  public expression?: string;

  constructor(name: string, subtype: string, expression?: string) {
    super(MetaType.ATTRIBUTE, subtype, name);  // No element passed, or pass {} if needed
    this.expression = expression;
  }
}