import { describe, expect, it } from "@jest/globals";
import * as path from "path";

import * as core from "../src";

describe("Rule Configurations ", () => {
  const example_uri1 = path.join(__dirname, "../../../assets/example-flows/force-app/main/default/flows/demo/Unconnected_Element.flow-meta.xml");

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("should use default when no configuration is provided", async () => {
    const flows = await core.parse([example_uri1]);
    const results: core.ScanResult[] = core.scan(flows, undefined);
    const rules = [...core.getRules(), ...core.getBetaRules()];
    const allRuleNames = rules.map((r) => r.name);
    const allRuleResults = results[0].ruleResults.map((r) => r.ruleName);
    expect(allRuleNames).toEqual(allRuleResults);
    expect(results[0].ruleResults).toHaveLength(rules.length);
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("should use default when no rules are specified", async () => {
    const flows = await core.parse([example_uri1]);
    const ruleConfig = {
      exceptions: {
        CreateANewAccountWithChild: { DuplicateDMLOperation: ["ViewAccountId"] },
      },
      rules: {},
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const rules = [...core.getRules(), ...core.getBetaRules()];
    const allRuleNames = rules.map((r) => r.name);
    const allRuleResults = results[0].ruleResults.map((r) => r.ruleName);
    expect(allRuleNames).toEqual(allRuleResults);
    expect(results[0].ruleResults).toHaveLength(rules.length);
  });

  it("incorrect rule severity configurations are defaulted", async () => {
    const flows = await core.parse([example_uri1]);
    const ruleConfig = {
      rules: {
        MissingNullHandler: {
          severity: "errorr",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults).toHaveLength(1);
  });

  it("incorrect rule configurations are skipped", async () => {
    const flows = await core.parse([example_uri1]);
    jest.spyOn(global.console, "error").mockImplementation(() => {});
    jest.spyOn(global.console, "log").mockImplementation(() => {});

    const ruleConfig = {
      exceptions: {
        CreateANewAccountWithChild: { DuplicateDMLOperation: ["ViewAccountId"] },
      },
      rules: {
        MissingNullHandler: {
          severity: "error",
        },
        MissingNullHandler2: {
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults).toHaveLength(1);
  });

  it("Multiple Expressions are individually checked", async () => {
    const flows = await core.parse([example_uri1]);
    const ruleConfig = {
      rules: {
        APIVersion: {
          expression: ">50",
          severity: "error",
        },
        CopyAPIName: {
          severity: "error",
        },
        DMLStatementInLoop: {
          severity: "error",
        },
        DuplicateDMLOperation: {
          severity: "error",
        },
        FlowDescription: {
          severity: "error",
        },
        FlowName: {
          expression: "[A-Za-z0-9]+_[A-Za-z0-9]+",
          severity: "error",
        },
        HardcodedId: {
          severity: "error",
        },
        MissingFaultPath: {
          severity: "error",
        },
        MissingNullHandler: {
          severity: "error",
        },
        SOQLQueryInLoop: {
          severity: "error",
        },
        UnconnectedElement: {
          severity: "error",
        },
        UnusedVariable: {
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults.find((r) => r.ruleName === "FlowName")?.occurs).toBe(false);
  });
});
