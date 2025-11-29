import { Violation } from "./Violation";

export interface FlatViolation extends Omit<Violation, 'details'> {
  flowFile: string;
  flowName: string;
  ruleName: string;
  severity: string;
}