import { Flow } from "./Flow";
import { RuleResult } from "./RuleResult";

export class ScanResult {
  public flow: Flow;

  public ruleResults: RuleResult[];
  constructor(flow: Flow, ruleResults: RuleResult[]) {
    this.flow = flow;
    this.ruleResults = ruleResults;
  }
}
