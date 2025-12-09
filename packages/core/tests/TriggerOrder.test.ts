import { describe, expect, it } from "@jest/globals";

import { Flow, RuleResult, scan, ScanResult } from "../src";
import { ParsedFlow } from "../src/main/models/ParsedFlow";
import { TriggerOrder } from "../src/main/rules/TriggerOrder";

describe("TriggerOrder", () => {
  it("should not trigger from default configuration on store", async () => {
    const ruleConfig = {
      ruleMode: "isolated",
      exceptions: {},
      rules: {
        FlowDescription: {
          severity: "error",
        },
      },
    };
    const flows: ParsedFlow[] = [
      {
        flow: {
          type: "AutoLaunchedFlow",
        },
      } as Partial<ParsedFlow> as ParsedFlow,
    ];
    const results: ScanResult[] = scan(flows, ruleConfig);
    const scanResults = results.pop();

    const ruleResults = scanResults?.ruleResults.find((rule) => {
      return rule.ruleDefinition.name === "TriggerOrder";
    });
    expect(ruleResults).toBeFalsy();
  });

  it("should trigger when opt-in configuration", async () => {
    const flows: ParsedFlow[] = [
      {
        flow: {
          start: {
            object: "Account",
          },
          type: "AutoLaunchedFlow",
        },
      } as Partial<ParsedFlow> as ParsedFlow,
    ];

    const ruleConfig = {
      exceptions: {},
      rules: {
        ruleMode: "isolated",
        TriggerOrder: {
          severity: "error",
        },
      },
    };
    const results: ScanResult[] = scan(flows, ruleConfig);
    const scanResults = results.pop();

    const expectedRule = scanResults?.ruleResults.find((rule) => rule.ruleName === "TriggerOrder");
    expect(expectedRule).toBeTruthy();
    expect(expectedRule?.occurs).toBe(true);
    expect(expectedRule?.details[0].details).toEqual({ expression: "10, 20, 30 ..." });
  });

  it("should flag trigger order when not present", async () => {
    const testData: ParsedFlow = {
      flow: {
        start: {
          object: "Account",
        },
        type: "AutoLaunchedFlow",
      },
    } as Partial<ParsedFlow> as ParsedFlow;

    const ruleResult: RuleResult = new TriggerOrder().execute(testData.flow as Flow);

    expect(ruleResult.occurs).toBeTruthy();
  });

  it("should not flag trigger order when present", async () => {
    const testData: ParsedFlow = {
      flow: {
        start: {
          object: "Account",
        },
        triggerOrder: 10,
        type: "AutoLaunchedFlow",
      },
    } as Partial<ParsedFlow> as ParsedFlow;

    const ruleResult: RuleResult = new TriggerOrder().execute(testData.flow as Flow);

    expect(ruleResult.occurs).toBeFalsy();
  });
});
