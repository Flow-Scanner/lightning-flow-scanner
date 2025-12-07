import { MetaType } from "../enums/MetaType";
import { FlowElement } from "./FlowElement";

export class FlowMetadata extends FlowElement {
  constructor(subtype: string, element: object) {
    super(MetaType.METADATA, subtype, element);
  }
}
