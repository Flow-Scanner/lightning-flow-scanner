import { MetaType } from "../enums/MetadataTypes";

export class FlowAttribute {
  public name: string;
  public subtype: string;
  public expression?: string;
  public metaType: MetaType = MetaType.ATTRIBUTE;

  constructor(name: string, subtype: string, expression?: string) {
    this.name = name;
    this.subtype = subtype;
    this.expression = expression;
  }
}