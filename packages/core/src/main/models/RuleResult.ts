import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { Violation } from "./Violation";

export class RuleResult {
  public occurs: boolean;
  public ruleName: string;
  public ruleDefinition: IRuleDefinition;
  public severity: string;
  public details: Violation[] = [];
  public errorMessage: string;

  constructor(info: IRuleDefinition, details: Violation[], errorMessage?: string) {
    this.ruleDefinition = info;
    this.ruleName = info.name;
    this.severity = info.severity ? info.severity : "error";
    this.occurs = false;
    this.details = details;
    if (details.length > 0) {
      this.occurs = true;
    }
    if (errorMessage) {
      this.errorMessage = errorMessage;
    }
  }
}
