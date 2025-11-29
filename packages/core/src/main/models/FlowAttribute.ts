export class FlowAttribute {
  public name: string;
  public subtype: string;
  public expression?: string;
  public metaType = "attribute";

  constructor(name: string, subtype: string, expression?: string) {
    this.name = name;
    this.subtype = subtype;
    this.expression = expression;
  }
}
