import { IRuleConfig } from "../interfaces/IRuleConfig";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { IRulesConfig, RuleCategory } from "../interfaces/IRulesConfig";
import { ruleRegistry } from "../config/RuleRegistry";

export function GetRuleDefinitions(
  ruleConfig?: Map<string, unknown>,
  options?: IRulesConfig
): IRuleDefinition[] {
  const includeBeta = options?.betaMode === true || options?.betamode === true;
  const includeSystem = options?.systemRules === true; // system rules are opt-in (defaults to false)
  const categories = options?.categories; // undefined means all categories
  const rulesMode = options?.ruleMode || "merged";
  const selectedRules: IRuleDefinition[] = [];

  const ruleIds = ruleRegistry.getAllRuleIds({ includeBeta, includeSystem });

  // ISOLATED MODE
  if (rulesMode === "isolated" && ruleConfig && ruleConfig.size > 0) {
    for (const key of ruleConfig.keys()) {
      // key can now be either ruleId (new) or legacyName (old config compatibility)
      const entry = ruleRegistry.get(key);
      if (!entry) continue;

      const config = ruleConfig.get(key) as IRuleConfig | undefined;
      if (config?.enabled === false) continue;

      const rule = ruleRegistry.createInstance(entry.ruleId);  // Always use ruleId to instantiate

      // Explicitly configured rules run even when they are system rules — the
      // systemRules flag only gates default (merged-mode) selection.
      if (!isCategoryIncluded(rule.category, categories, true)) continue;

      if (config?.severity) {
        rule.severity = config.severity;
      }

      selectedRules.push(rule);
    }
    return selectedRules;
  }

  // MERGED MODE (default)
  for (const ruleId of ruleIds) {
    const rule = ruleRegistry.createInstance(ruleId);

    // Skip system rules if disabled
    if (rule.category === 'system' && !includeSystem) continue;

    // Skip rules not in selected categories (if categories filter is specified)
    if (!isCategoryIncluded(rule.category, categories, includeSystem)) continue;

    // Try to find config by ruleId first, then fall back to legacy name
    const config = (
      ruleConfig?.get(rule.ruleId) ??
      ruleConfig?.get(rule.name)  // rule.name is the legacy camelCase name (e.g. "ActionCallsInLoop")
    ) as IRuleConfig | undefined;

    if (config?.enabled === false) continue;

    if (config?.severity) {
      rule.severity = config.severity;
    }

    selectedRules.push(rule);
  }

  return selectedRules;
}

/**
 * Check if a rule's category should be included based on the categories filter.
 * - If no categories filter is specified, all categories are included
 * - System rules are handled separately via includeSystem flag
 * - Rules with matching category are included
 * - Category matching is case-insensitive
 */
function isCategoryIncluded(
  ruleCategory: string | undefined,
  categories: RuleCategory[] | undefined,
  includeSystem: boolean
): boolean {
  // System category is controlled by systemRules flag, not categories filter
  if (ruleCategory === 'system') {
    return includeSystem;
  }

  // If no categories filter specified, include all non-system categories
  if (!categories || categories.length === 0) {
    return true;
  }

  // Normalize categories to lowercase for case-insensitive matching
  const normalizedCategories = categories.map(c => c.toLowerCase() as RuleCategory);

  // Check if rule's category is in the allowed list (case-insensitive)
  return normalizedCategories.includes(ruleCategory?.toLowerCase() as RuleCategory);
}

export function getRules(
  ruleNames?: string[],
  options?: IRulesConfig
): IRuleDefinition[] {
  return ruleRegistry.getRulesByNames(ruleNames, options);
}
