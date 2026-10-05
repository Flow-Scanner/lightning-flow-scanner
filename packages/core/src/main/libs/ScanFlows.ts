import type { IRuleDefinition } from "../interfaces/IRuleDefinition";
import {
  Flow,
  IRulesConfig,
  RuleResult,
  ScanResult,
} from "../../main/internals/internals";
import { DetailLevel, meetsThreshold } from "../interfaces/IRulesConfig";
import { ParsedFlow } from "../models/ParsedFlow";
import { enrichViolationsWithLineNumbers, stripViolationDetails } from "../models/Violation";
import { FlatViolation } from "../models/FlatViolation";
import { GetRuleDefinitions } from "./GetRuleDefinitions";
import { flatten } from "./Flatten";
import { getRuleDocumentationUrl } from "./RuleDocumentation";

function getRuleConfigByIdOrName(
  rule: IRuleDefinition,
  rulesConfig?: Record<string, any>
): any | undefined {
  if (!rulesConfig) return undefined;
  // Try ruleId first, then fall back to name
  return rulesConfig[rule.ruleId] || rulesConfig[rule.name];
}

function getSuppressionsForRule(
  rule: IRuleDefinition,
  flowName: string,
  exceptions?: Record<string, Record<string, string[]>>
): string[] {
  if (!exceptions?.[flowName]) return [];
  const flowExceptions = exceptions[flowName];
  // Try ruleId first, then fall back to name
  const rawSuppressions = flowExceptions[rule.ruleId] || flowExceptions[rule.name];
  // If wildcard exists, return only wildcard; otherwise return array or empty
  return rawSuppressions?.includes("*") ? ["*"] : (rawSuppressions ?? []);
}

export function scan(parsedFlows: ParsedFlow[], ruleOptions?: IRulesConfig): ScanResult[] {
  const flows: Flow[] = [];
  const ignoreFlows = ruleOptions?.ignoreFlows || [];

  for (const flow of parsedFlows) {
    if (!flow.errorMessage && flow.flow) {
      // Filter out flows whose names are in the ignore list
      if (ignoreFlows.length > 0 && ignoreFlows.includes(flow.flow.name)) {
        continue;
      }
      flows.push(flow.flow);
    }
  }
  const scanResults = ScanFlows(flows, ruleOptions);
  return scanResults;
}

/**
 * Scan and return one flat, uniformly-typed record per violation — the
 * primary output shape for downstream consumers (CSV, CI annotations,
 * dashboards). Use scan() when the per-flow tree is needed (e.g. SARIF).
 */
export function scanFlat(parsedFlows: ParsedFlow[], ruleOptions?: IRulesConfig): FlatViolation[] {
  return flatten(scan(parsedFlows, ruleOptions));
}

export function ScanFlows(flows: Flow[], ruleOptions?: IRulesConfig): ScanResult[] {
  const flowResults: ScanResult[] = [];
  const rawMode = ruleOptions?.detailLevel;
  const detailLevel =
    typeof rawMode === 'string' && rawMode.toLowerCase() === 'simple'
      ? DetailLevel.SIMPLE
      : DetailLevel.ENRICHED;

  let ruleMap: Map<string, object> | undefined = undefined;
  if (ruleOptions?.rules && Object.keys(ruleOptions.rules).length > 0) {
    ruleMap = new Map<string, object>();
    for (const [ruleName, config] of Object.entries(ruleOptions.rules)) {
      ruleMap.set(ruleName, config);
    }
  }

  // This ensures default rules are loaded and merged with any custom configs
  const selectedRules = GetRuleDefinitions(ruleMap, ruleOptions);

  const flowXmlCache = new Map<string, string>();

  for (const flowInput of flows) {
    const flow = flowInput instanceof Flow ? flowInput : Flow.from(flowInput);
    const ruleResults: RuleResult[] = [];

    for (const rule of selectedRules) {
      try {
        if (!rule.supportedTypes.includes(flow.type)) {
          ruleResults.push(new RuleResult(rule, []));
          continue;
        }

        const config = getRuleConfigByIdOrName(rule, ruleOptions?.rules);
        const suppressions = getSuppressionsForRule(rule, flow.name, ruleOptions?.exceptions);

        // Merge subflowResolver into rule options if available
        const ruleConfig = ruleOptions?.subflowResolver
          ? { ...config, subflowResolver: ruleOptions.subflowResolver }
          : config;

        const result =
          ruleConfig && Object.keys(ruleConfig).length > 0
            ? rule.execute(flow, ruleConfig, suppressions)
            : rule.execute(flow, undefined, suppressions);

        // Apply custom message if provided in config, otherwise use summary
        if (config && typeof config === 'object' && 'message' in config && typeof config.message === 'string') {
          result.message = config.message;
        } else {
          // Use summary if available, otherwise fallback to description
          result.message = result.ruleDefinition.summary || result.ruleDefinition.description;
        }

        // Apply custom messageUrl if provided in config, otherwise auto-generate from rule label
        const customUrl = config && typeof config === 'object' && 'messageUrl' in config && typeof config.messageUrl === 'string'
          ? config.messageUrl
          : undefined;
        result.messageUrl = getRuleDocumentationUrl(result.ruleDefinition.label, customUrl);

        if (result.details.length > 0) {
          let flowXml = flowXmlCache.get(flow.name);
          if (!flowXml) {
            flowXml = flow.toXMLString();
            flowXmlCache.set(flow.name, flowXml);
          }
          if (flowXml) {
            enrichViolationsWithLineNumbers(result.details, flowXml);
          }
        }

        ruleResults.push(result);
      } catch (error) {
        const message = `Something went wrong while executing ${rule.name} in the Flow: ${flow.name} with error ${error}`;
        ruleResults.push(new RuleResult(rule, [], message));
      }
    }

    flowResults.push(new ScanResult(flow, ruleResults));
    flowXmlCache.delete(flow.name);
  }

  flowXmlCache.clear();

  if (detailLevel === DetailLevel.SIMPLE) {
    flowResults.forEach(scanResult => {
      scanResult.ruleResults.forEach(ruleResult => {
        ruleResult.details.forEach(stripViolationDetails);
      });
    });
  }

  // Apply threshold filtering if specified
  const threshold = ruleOptions?.threshold;
  if (threshold && threshold !== 'never') {
    for (const scanResult of flowResults) {
      scanResult.ruleResults = scanResult.ruleResults.filter(ruleResult => {
        // Get effective severity (config override or rule default)
        const config = getRuleConfigByIdOrName(ruleResult.ruleDefinition, ruleOptions?.rules);
        const severity = config?.severity || ruleResult.severity || 'warning';
        return meetsThreshold(severity, threshold);
      });
    }
  }

  return flowResults;
}