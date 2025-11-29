export class FlowElement {
  public subtype: string;
  public metaType: string;
  public element: string | object[] | object = {};
  public connectors?: object[];
  public name?: string;
  public locationX?: string;
  public locationY?: string;

  constructor(metaType: string, subtype: string, element: object) {
    this.element = element;
    this.subtype = subtype;
    this.metaType = metaType;
  }
}
