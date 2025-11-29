import { Flow } from "./Flow";

export class ParsedFlow {
  public uri: string;
  public flow: Flow | undefined;
  public errorMessage?: string;

  constructor(uri: string, flow: Flow, errorMessage?: string) {
    this.uri = uri;
    this.flow = flow;
    if (errorMessage) {
      this.errorMessage = errorMessage;
    }
  }
}
