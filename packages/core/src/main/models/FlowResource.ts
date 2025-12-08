import { MetaType } from "../enums/MetadataTypes";
import { FlowElement } from "./FlowElement";

export class FlowResource extends FlowElement {
  constructor(name: string, subtype: string, element: object) {
    super(MetaType.RESOURCE, subtype, name, element);
  }
}