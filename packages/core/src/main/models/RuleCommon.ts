import { RuleInfo } from "./RuleInfo";
import * as core from "../internals/internals";
export abstract class RuleCommon {
  public description: string;
  public docRefs: Array<{ label: string; path: string }> = [];
  public isConfigurable: boolean; // Auto-detected by checking if the implemented check() method actually uses "options."
  public label: string;
  public name: string;
  public severity?: string;
  public supportedTypes: string[];
  public suppressionElement?: string;
  public uri?: string;
  constructor(info: RuleInfo, optional?: { severity?: string }) {
    this.name = info.name;
    this.supportedTypes = info.supportedTypes;
    this.label = info.label;
    this.description = info.description;
    this.uri = `https://github.com/Lightning-Flow-Scanner/lightning-flow-scanner-core/tree/main/src/main/rules/${info.name}.ts`;
    this.docRefs = info.docRefs;

    const checkImpl = (this as any).check;
    if (typeof checkImpl === "function") {
      const source = checkImpl.toString();
      this.isConfigurable = /options[.\?]/.test(source);
    } else {
      this.isConfigurable = false;
    }

    this.severity = optional?.severity ?? "error";
    this.suppressionElement = info.suppressionElement;
  }
  /**
   * execute() – automatic suppression
   */
  public execute(
    flow: core.Flow,
    options?: object,
    suppressions: string[] = []
  ): core.RuleResult {
    // Wildcard suppression disables entire rule
    if (suppressions.includes("*")) {
      return new core.RuleResult(this as any, []);
    }
    // Convert to Set for fast lookup
    const suppSet = new Set(suppressions);
    // Raw violations from rule
    let violations = this.check(flow, options, suppSet);
    // Automatically filter suppressed violations by their .name
    violations = violations.filter(v => !suppSet.has(v.name));
    // Wrap into RuleResult
    return new core.RuleResult(this as any, violations);
  }
  /**
   * Rules implement this. They should return *all* violations,
   * NOT pre-filter suppressed ones (unless they need early-exit performance).
   */
  protected abstract check(
    flow: core.Flow,
    options: object | undefined,
    suppressions: Set<string>
  ): core.Violation[];
  /**
   * Legacy/manual suppression helper (still available for early exits)
   */
  protected isSuppressed(name: string, suppressions: Set<string>): boolean {
    return suppressions.has(name);
  }
}