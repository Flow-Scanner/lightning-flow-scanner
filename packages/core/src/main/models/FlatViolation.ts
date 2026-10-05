import { Violation } from "./Violation";

/**
 * One self-contained record per violation: the (already flat) Violation plus
 * its flow and rule context. Lossless — every Violation field carries over.
 */
export interface FlatViolation extends Violation {
  flowFile: string;
  flowName: string;
  ruleId: string; // Canonical rule ID (e.g., "dml-in-loop")
  ruleName: string; // Legacy class name (e.g., "DMLStatementInLoop")
  severity: string;
  message?: string; // Custom message overriding the default rule description
  messageUrl?: string; // URL to custom documentation
}
