import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { IRuleConfig } from "../interfaces/IRuleConfig";
import { IRulesConfig } from "../interfaces/IRulesConfig";
// Import all rules
import { ActionCallsInLoop } from "../rules/ActionCallsInLoop";
import { APIVersion } from "../rules/APIVersion";
import { AutoLayout } from "../rules/AutoLayout";
import { CognitiveComplexity } from "../rules/CognitiveComplexity";
import { CopyAPIName } from "../rules/CopyAPIName";
import { CyclomaticComplexity } from "../rules/CyclomaticComplexity";
import { DMLStatementInLoop } from "../rules/DMLStatementInLoop";
import { DuplicateDMLOperation } from "../rules/DuplicateDMLOperation";
import { FlowDescription } from "../rules/FlowDescription";
import { FlowName } from "../rules/FlowName";
import { GetRecordAllFields } from "../rules/GetRecordAllFields";
import { HardcodedId } from "../rules/HardcodedId";
import { HardcodedUrl } from "../rules/HardcodedUrl";
import { HardcodedSecret } from "../rules/HardcodedSecret";
import { InactiveFlow } from "../rules/InactiveFlow";
import { MissingFaultPath } from "../rules/MissingFaultPath";
import { MissingNullHandler } from "../rules/MissingNullHandler";
import { ProcessBuilder } from "../rules/ProcessBuilder";
import { RecursiveAfterUpdate } from "../rules/RecursiveAfterUpdate";
import { SameRecordFieldUpdates } from "../rules/SameRecordFieldUpdates";
import { SOQLQueryInLoop } from "../rules/SOQLQueryInLoop";
import { TriggerOrder } from "../rules/TriggerOrder";
import { UnconnectedElement } from "../rules/UnconnectedElement";
import { UnsafeRunningContext } from "../rules/UnsafeRunningContext";
import { UnusedVariable } from "../rules/UnusedVariable";
import { MissingMetadataDescription } from "../rules/MissingMetadataDescription";
import { MissingRecordTriggerFilter } from "../rules/MissingRecordTriggerFilter";
import { MissingStartReference } from "../rules/MissingStartReference";
import { TransformInsteadOfLoop } from "../rules/TransformInsteadOfLoop";
import { RecordIdAsString } from "../rules/RecordIdAsString";
import { UnresolvedSubflow } from "../rules/UnresolvedSubflow";
import { PreventPassingUserDataIntoElementWithSharing } from "../rules/PreventPassingUserDataIntoElementWithSharing";

type RuleConstructor = new () => IRuleDefinition;

interface RuleRegistryEntry {
  ruleId: string;
  ruleClass: RuleConstructor;
  legacyName: string;
  isBeta: boolean;
  isSystem: boolean;
}

class RuleRegistry {
  private rules: Map<string, RuleRegistryEntry> = new Map();
  private legacyNameMap: Map<string, string> = new Map();

  register(
    ruleId: string,
    ruleClass: RuleConstructor,
    legacyName: string,
    options: { isBeta?: boolean; isSystem?: boolean } = {}
  ): void {
    const entry: RuleRegistryEntry = {
      ruleId,
      ruleClass,
      legacyName,
      isBeta: options.isBeta ?? false,
      isSystem: options.isSystem ?? false,
    };
    this.rules.set(ruleId, entry);
    this.legacyNameMap.set(legacyName, ruleId);
  }

  get(idOrLegacyName: string): RuleRegistryEntry | undefined {
    let entry = this.rules.get(idOrLegacyName);
    if (!entry) {
      const ruleId = this.legacyNameMap.get(idOrLegacyName);
      if (ruleId) {
        entry = this.rules.get(ruleId);
      }
    }
    return entry;
  }

  getAllRuleIds(options: { includeBeta?: boolean; includeSystem?: boolean } = {}): string[] {
    const { includeBeta = false, includeSystem = false } = options;
    return Array.from(this.rules.values())
      .filter(entry => {
        if (entry.isBeta && !includeBeta) return false;
        if (entry.isSystem && !includeSystem) return false;
        return true;
      })
      .map(entry => entry.ruleId);
  }

  has(idOrLegacyName: string): boolean {
    return this.get(idOrLegacyName) !== undefined;
  }

  createInstance(idOrLegacyName: string): IRuleDefinition {
    const entry = this.get(idOrLegacyName);
    if (!entry) {
      throw new Error(`Rule not found: ${idOrLegacyName}`);
    }
    return new entry.ruleClass();
  }

  getRules(
    ruleConfig?: Map<string, unknown>,
    options?: IRulesConfig
  ): IRuleDefinition[] {
    const includeBeta = options?.betaMode === true || options?.betamode === true;
    const includeSystem = options?.systemRules === true;
    const rulesMode = options?.ruleMode || "merged";
    const selectedRules: IRuleDefinition[] = [];

    if (rulesMode === "isolated" && ruleConfig && ruleConfig.size > 0) {
      for (const key of ruleConfig.keys()) {
        const entry = this.get(key);
        if (!entry) continue;

        // Explicitly configured rules run even when they are system rules — the
        // systemRules flag only gates default (merged-mode) selection.
        const config = ruleConfig.get(key) as IRuleConfig | undefined;
        if (config?.enabled === false) continue;

        const rule = this.createInstance(entry.ruleId);
        if (config?.severity) {
          rule.severity = config.severity;
        }

        selectedRules.push(rule);
      }
      return selectedRules;
    }

    const allRuleIds = this.getAllRuleIds({ includeBeta, includeSystem });

    for (const ruleId of allRuleIds) {
      const rule = this.createInstance(ruleId);

      const config = (
        ruleConfig?.get(rule.ruleId) ??
        ruleConfig?.get(rule.name)
      ) as IRuleConfig | undefined;

      if (config?.enabled === false) continue;
      if (config?.severity) {
        rule.severity = config.severity;
      }

      selectedRules.push(rule);
    }

    return selectedRules;
  }

  getRulesByNames(ruleNames?: string[], options?: IRulesConfig): IRuleDefinition[] {
    if (!ruleNames || ruleNames.length === 0) {
      return this.getRules(undefined, options);
    }

    const config = new Map<string, IRuleConfig>();
    for (const identifier of ruleNames) {
      const entry = this.get(identifier);
      if (entry) {
        config.set(entry.ruleId, { enabled: true });
      }
    }

    return this.getRules(config, { ...options, ruleMode: "isolated" });
  }
}

const registry = new RuleRegistry();

registry.register("action-call-in-loop", ActionCallsInLoop, "ActionCallsInLoop");
registry.register("invalid-api-version", APIVersion, "APIVersion");
registry.register("missing-auto-layout", AutoLayout, "AutoLayout");
registry.register("unclear-api-naming", CopyAPIName, "CopyAPIName");
registry.register("cognitive-complexity", CognitiveComplexity, "CognitiveComplexity", { isBeta: true });
registry.register("excessive-cyclomatic-complexity", CyclomaticComplexity, "CyclomaticComplexity");
registry.register("dml-in-loop", DMLStatementInLoop, "DMLStatementInLoop");
registry.register("duplicate-dml", DuplicateDMLOperation, "DuplicateDMLOperation");
registry.register("missing-flow-description", FlowDescription, "FlowDescription");
registry.register("invalid-naming-convention", FlowName, "FlowName");
registry.register("get-record-all-fields", GetRecordAllFields, "GetRecordAllFields");
registry.register("hardcoded-id", HardcodedId, "HardcodedId");
registry.register("hardcoded-url", HardcodedUrl, "HardcodedUrl");
registry.register("inactive-flow", InactiveFlow, "InactiveFlow");
registry.register("missing-fault-path", MissingFaultPath, "MissingFaultPath");
registry.register("missing-null-handler", MissingNullHandler, "MissingNullHandler");
registry.register("process-builder-usage", ProcessBuilder, "ProcessBuilder");
registry.register("recursive-record-update", RecursiveAfterUpdate, "RecursiveAfterUpdate");
registry.register("same-record-field-updates", SameRecordFieldUpdates, "SameRecordFieldUpdates");
registry.register("soql-in-loop", SOQLQueryInLoop, "SOQLQueryInLoop");
registry.register("unspecified-trigger-order", TriggerOrder, "TriggerOrder");
registry.register("unreachable-element", UnconnectedElement, "UnconnectedElement");
registry.register("unsafe-running-context", UnsafeRunningContext, "UnsafeRunningContext");
registry.register("unused-variable", UnusedVariable, "UnusedVariable");

registry.register("missing-metadata-description", MissingMetadataDescription, "MissingMetadataDescription", { isBeta: true });
registry.register("missing-record-trigger-filter", MissingRecordTriggerFilter, "MissingFilterRecordTrigger", { isBeta: true });
registry.register("missing-start-reference", MissingStartReference, "MissingStartReference", { isBeta: true, isSystem: true });
registry.register("transform-instead-of-loop", TransformInsteadOfLoop, "TransformInsteadOfLoop", { isBeta: true });
registry.register("record-id-as-string", RecordIdAsString, "RecordIdAsString", { isBeta: true });
registry.register("hardcoded-secret", HardcodedSecret, "HardcodedSecret", { isBeta: true });
registry.register("prevent-passing-user-data-into-element-with-sharing", PreventPassingUserDataIntoElementWithSharing, "PreventPassingUserDataIntoElementWithSharing", { isBeta: true });

// System rules - catch issues prevented by Flow Builder UI (valuable for AI-edited XML).
// Disabled by default; enable with systemRules: true.
registry.register("unresolved-subflow", UnresolvedSubflow, "UnresolvedSubflow", { isBeta: true, isSystem: true });

export const ruleRegistry = registry;
