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
  
  // Default to "merged" mode for backward compatibility
  const rulesMode = options?.ruleMode || "merged";

  // In "isolated" mode, only load rules that are explicitly configured
  if (rulesMode === "isolated" && ruleConfig && ruleConfig.size > 0) {
    for (const ruleName of ruleConfig.keys()) {
      try {
        const customConfig = ruleConfig.get(ruleName);
        
        // Skip if explicitly disabled
        if (customConfig && customConfig["enabled"] === false) {
          continue;
        }

        // Create the rule instance
        const matchedRule = new DynamicRule(ruleName, includeBeta) as IRuleDefinition;

        // Apply custom severity if provided
        const configuredSeverity = customConfig?.["severity"];
        if (
          configuredSeverity &&
          (configuredSeverity === "error" ||
           configuredSeverity === "warning" ||
           configuredSeverity === "note")
        ) {
          matchedRule.severity = configuredSeverity;
        }

        selectedRules.push(matchedRule);
      } catch (error) {
        console.log(error.message);
      }
    }
    return selectedRules;
  }

  // In "merged" mode (default), start with all default rules and merge with config
  const allRuleNames = new Set<string>();
  
  // Add all default rules
  for (const ruleName in DefaultRuleStore) {
    allRuleNames.add(ruleName);
  }

  // Add beta rules if beta mode is enabled
  if (includeBeta) {
    for (const ruleName in BetaRuleStore) {
      allRuleNames.add(ruleName);
    }
  }

  // Process each rule
  for (const ruleName of allRuleNames) {
    try {
      // Check if there's a custom config for this rule
      const customConfig = ruleConfig?.get(ruleName);
      
      // Skip if explicitly disabled
      if (customConfig && customConfig["enabled"] === false) {
        continue;
      }

      // Create the rule instance
      const matchedRule = new DynamicRule(ruleName, includeBeta) as IRuleDefinition;

      // Apply custom severity if provided
      const configuredSeverity = customConfig?.["severity"];
      if (
        configuredSeverity &&
        (configuredSeverity === "error" ||
         configuredSeverity === "warning" ||
         configuredSeverity === "note")
      ) {
        matchedRule.severity = configuredSeverity;
      }

      selectedRules.push(matchedRule);
    } catch (error) {
      console.log(error.message);
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