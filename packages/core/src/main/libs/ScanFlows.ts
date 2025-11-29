import type { IRuleDefinition } from "../interfaces/IRuleDefinition";
import {
  Flow,
  IRulesConfig,
  RuleResult,
  ScanResult,
} from "../../main/internals/internals";
import { DetailLevel } from "../interfaces/IRulesConfig";
import { ParsedFlow } from "../models/ParsedFlow";
import { enrichViolationsWithLineNumbers } from "../models/Violation";
import { GetRuleDefinitions } from "./GetRuleDefinitions";

export function scan(parsedFlows: ParsedFlow[], ruleOptions?: IRulesConfig): ScanResult[] {
  const flows: Flow[] = [];
  for (const flow of parsedFlows) {
    if (!flow.errorMessage && flow.flow) {
      flows.push(flow.flow);
    }
  }
  const scanResults = ScanFlows(flows, ruleOptions);
  return scanResults;
}

export function ScanFlows(flows: Flow[], ruleOptions?: IRulesConfig): ScanResult[] {
  const flowResults: ScanResult[] = [];
  let selectedRules: IRuleDefinition[] = [];
  const rawMode = ruleOptions?.detailLevel;
  const detailLevel =
    typeof rawMode === 'string' && rawMode.toLowerCase() === 'simple'
      ? DetailLevel.SIMPLE
      : DetailLevel.ENRICHED;

  if (ruleOptions?.rules && Object.keys(ruleOptions.rules).length > 0) {
    const ruleMap = new Map<string, object>();
    for (const [ruleName, config] of Object.entries(ruleOptions.rules)) {
      ruleMap.set(ruleName, config);
    }
    selectedRules = GetRuleDefinitions(ruleMap, ruleOptions);

  } else {
    selectedRules = GetRuleDefinitions(undefined, ruleOptions);
  }

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

        let config: object | undefined = undefined;
        if (ruleOptions?.rules?.[rule.name]) {
          config = ruleOptions.rules[rule.name];
        }

        const rawSuppressions: string[] | undefined =
          ruleOptions?.exceptions?.[flow.name]?.[rule.name];

        const suppressions: string[] =
          rawSuppressions?.includes("*") ? ["*"] : (rawSuppressions ?? []);

        const result =
          config && Object.keys(config).length > 0
            ? rule.execute(flow, config, suppressions)
            : rule.execute(flow, undefined, suppressions);

        if (result.severity !== rule.severity) {
          result.severity = rule.severity as string;
        }

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
        ruleResult.details.forEach(violation => {
          delete violation.details;
        });
      });
    });
  }

  return flowResults;
}
