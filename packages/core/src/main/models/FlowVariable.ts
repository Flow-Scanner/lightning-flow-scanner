import { MetaType } from "../enums/MetadataTypes";
import { FlowElement } from "./FlowElement";

export class FlowVariable extends FlowElement {
  public dataType: string;

  constructor(name: string, subtype: string, element: object) {
    super(MetaType.VARIABLE, subtype, name, element);
    this.dataType = element["dataType"];
  }
}