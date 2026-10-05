import { IExceptions } from "./IExceptions";
import { IRuleOptions } from "./IRuleOptions";
import { SubflowResolver } from "../libs/SubflowResolver";

export enum DetailLevel {
  ENRICHED = 'enriched',
  SIMPLE = 'simple'
}

export type RuleCategory = 'problem' | 'suggestion' | 'layout';
export type Severity = 'error' | 'warning' | 'note';
export type Threshold = Severity | 'never';

/** Severity levels ordered from most to least severe */
export const SEVERITY_ORDER: Severity[] = ['error', 'warning', 'note'];

export interface IRulesConfig {
  betaMode?: boolean;  // Toggles beta rules; defaults to false
  betamode?: boolean;  // Use betaMode instead; to be removed
  systemRules?: boolean; // Opts into system rules (category: 'system', e.g. unresolved subflows); defaults to false
  categories?: RuleCategory[]; // Filter rules by category; if specified, only these categories run
  threshold?: Threshold; // Minimum severity to report; 'never' means report all but don't fail
  detailLevel?: 'enriched' | 'simple' | DetailLevel;
  exceptions?: IExceptions;
  rules?: IRuleOptions;
  ruleMode?: "merged" | "isolated"; // Defaults to "merged"
  ignoreFlows?: string[]; // Flow API names to exclude from scanning
  subflowResolver?: SubflowResolver; // Resolver for cross-flow subflow analysis
}

/**
 * Check if a severity meets or exceeds the threshold.
 * @param severity - The severity to check
 * @param threshold - The threshold to compare against
 * @returns true if severity >= threshold (more severe or equal)
 */
export function meetsThreshold(severity: string | undefined, threshold: Threshold): boolean {
  if (threshold === 'never') return false;
  const sev = (severity || 'warning') as Severity;
  const sevIndex = SEVERITY_ORDER.indexOf(sev);
  const thresholdIndex = SEVERITY_ORDER.indexOf(threshold);
  // Lower index = more severe, so severity meets threshold if sevIndex <= thresholdIndex
  return sevIndex >= 0 && sevIndex <= thresholdIndex;
}

/**
 * Count violations that meet or exceed the threshold.
 * @param results - Array of results with severity property
 * @param threshold - The threshold to compare against
 * @returns Number of violations meeting the threshold
 */
export function countThresholdViolations(
  results: Array<{ severity?: string }>,
  threshold: Threshold
): number {
  if (threshold === 'never') return 0;
  return results.filter(r => meetsThreshold(r.severity, threshold)).length;
}

/**
 * Filter results to only include those meeting the threshold.
 * @param results - Array of results with severity property
 * @param threshold - The threshold to filter by
 * @returns Filtered array of results meeting the threshold ('never' returns all)
 */
export function filterByThreshold<T extends { severity?: string }>(
  results: T[],
  threshold: Threshold
): T[] {
  if (threshold === 'never') return results;
  return results.filter(r => meetsThreshold(r.severity, threshold));
}
