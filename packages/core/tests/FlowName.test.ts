import * as core from "../src";
import * as path from "path";

import { describe, it, expect } from "@jest/globals";

describe("FlowName", () => {
  const example_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/demo/FlowNamingConvention.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/testing/Flow_Naming_Convention_Fixed.flow-meta.xml");

  it("should have a result when not in line with conventions", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        FlowName: {
          severity: "error",
          expression: "[A-Za-z0-9]+_[A-Za-z0-9]+",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("FlowName");
    expect(results[0].ruleResults[0].occurs).toBe(true);
  });

  it("should have no result when defined as exception", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        FlowName: {
          severity: "error",
          expression: "[0-9]",
        },
      },
      exceptions: {
        FlowNamingConvention: { FlowName: ["FlowNamingConvention"] },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("FlowName");
    expect(results[0].ruleResults[0].occurs).toBe(false);
  });

  it("should not have a result when in line with conventions", async () => {
    const flows = await core.parse([fixed_uri]);
    const ruleConfig = {
      rules: {
        FlowName: {
          severity: "error",
          expression: "[A-Za-z0-9]+_[A-Za-z0-9]+",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });
});
