import { MetaType } from "../enums/MetadataTypes";
import { FlowElement } from "./FlowElement";

export class FlowMetadata extends FlowElement {
  constructor(subtype: string, element: object) {
    super(MetaType.ATTRIBUTE, subtype, element);
  }
}
