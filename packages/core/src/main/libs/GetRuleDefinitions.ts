import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { IRulesConfig } from "../interfaces/IRulesConfig";
import { BetaRuleStore, DefaultRuleStore } from "../store/DefaultRuleStore";
import { DynamicRule } from "./DynamicRule";

export function GetRuleDefinitions(
  ruleConfig?: Map<string, unknown>,
  options?: IRulesConfig
): IRuleDefinition[] {
  const selectedRules: IRuleDefinition[] = [];
  const includeBeta = options?.betaMode === true || options?.betamode === true;

  if (ruleConfig && ruleConfig instanceof Map) {
    for (const ruleName of ruleConfig.keys()) {
      let severity = "warning";
      try {
        const configuredSeverity = ruleConfig.get(ruleName)?.["severity"];
        if (
          configuredSeverity &&
          (configuredSeverity === "error" ||
           configuredSeverity === "warning" ||
           configuredSeverity === "note")
        ) {
          severity = configuredSeverity;
        }

        // Pass betaMode to DynamicRule
        const matchedRule = new DynamicRule(ruleName, includeBeta) as IRuleDefinition;
        if (configuredSeverity) matchedRule.severity = severity;
        selectedRules.push(matchedRule);

      } catch (error) {
        console.log(error.message);
      }
    }
  } else {
    // Load all defaults
    for (const rule in DefaultRuleStore) {
      const matchedRule = new DynamicRule(rule, includeBeta) as IRuleDefinition;
      selectedRules.push(matchedRule);
    }
  }

  // Optionally add beta-only rules that are not in defaults
  if (includeBeta) {
    for (const betaRuleName in BetaRuleStore) {
      if (!selectedRules.some(r => r.name === betaRuleName)) {
        const betaRule = new DynamicRule(betaRuleName, true) as IRuleDefinition;
        selectedRules.push(betaRule);
      }
    }
  }

  return selectedRules;
}

export function getRules(ruleNames?: string[], options?: IRulesConfig): IRuleDefinition[] {
  if (ruleNames && ruleNames.length > 0) {
    const ruleSeverityMap = new Map<string, { severity: string }>(
      ruleNames.map(name => [name, { severity: "error" }])
    );
    return GetRuleDefinitions(ruleSeverityMap, options);
  }
  return GetRuleDefinitions(undefined, options);
}
