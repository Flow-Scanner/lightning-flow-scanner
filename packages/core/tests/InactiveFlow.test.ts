import { ParsedFlow } from "../src/main/models/ParsedFlow";
import { scan, ScanResult } from "../src";

import { describe, it, expect } from "@jest/globals";

describe("InactiveFlow", () => {
  it("should return a result when flow is inactive", async () => {
    const flows: ParsedFlow[] = [
      {
        flow: {
          type: "AutoLaunchedFlow",
          status: "Draft",
        },
      } as Partial<ParsedFlow> as ParsedFlow,
    ];
    const ruleConfig = {
      rules: {
        InactiveFlow: {
          severity: "error",
        },
      },
    };

    const results: ScanResult[] = scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("InactiveFlow");
    expect(occurringResults[0].occurs).toBeTruthy();
  });

  it("should have no result when flow is active", async () => {
    const flows: ParsedFlow[] = [
      {
        flow: {
          status: "Active",
          type: "AutoLaunchedFlow",
        },
      } as Partial<ParsedFlow> as ParsedFlow,
    ];
    const ruleConfig = {
      rules: {
        InactiveFlow: {
          severity: "error",
        },
      },
    };

    const [result] = scan(flows, ruleConfig);
    expect(result.ruleResults).toHaveLength(1);
    expect(result.ruleResults[0].ruleName).toEqual("InactiveFlow");
    expect(result.ruleResults[0].occurs).toBeFalsy();
  });

  it("should return a result when flow is obsolete", async () => {
    const flows: ParsedFlow[] = [
      {
        flow: {
          type: "AutoLaunchedFlow",
          status: "Obsolete",
        },
      } as Partial<ParsedFlow> as ParsedFlow,
    ];
    const ruleConfig = {
      rules: {
        InactiveFlow: {
          severity: "error",
        },
      },
    };

    const results: ScanResult[] = scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("InactiveFlow");
  });

  it("should return a result when flow is InvalidDraft (draft)", async () => {
    const flows: ParsedFlow[] = [
      {
        flow: {
          type: "AutoLaunchedFlow",
          status: "InvalidDraft",
        },
      } as Partial<ParsedFlow> as ParsedFlow,
    ];
    const ruleConfig = {
      rules: {
        InactiveFlow: {
          severity: "error",
        },
      },
    };

    const results: ScanResult[] = scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("InactiveFlow");
  });
});
