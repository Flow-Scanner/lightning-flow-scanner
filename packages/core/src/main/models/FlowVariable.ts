import { MetaType } from "../enums/MetaType";
import { FlowElement } from "./FlowElement";

export class FlowVariable extends FlowElement {
  public name: string;
  public dataType: string;

  constructor(name: string, subtype: string, element: object) {
    super(MetaType.VARIABLE, subtype, element);
    this.name = name;
    this.dataType = element["dataType"];
  }
}
