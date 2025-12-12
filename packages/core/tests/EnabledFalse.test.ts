import * as core from "../src";
import * as path from "path";
import { describe, it, expect } from "@jest/globals";

describe("Rule Enabled Flag", () => {
  const example_uri = path.join(
    __dirname, 
    "../../../example-flows/force-app/demo/Outdated_API_Version.flow-meta.xml"
  );

  it("should not run a rule when enabled is set to false", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        APIVersion: {
          enabled: false,
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    
    // No rules should be executed since the only rule is disabled
    expect(results[0].ruleResults).toHaveLength(0);
  });

  it("should run other rules when one is disabled in merged mode", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      ruleMode: "merged",
      rules: {
        APIVersion: {
          enabled: false,
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    
    // Should have results from other default rules, but not APIVersion
    expect(results[0].ruleResults.length).toBeGreaterThan(0);
    const apiVersionResult = results[0].ruleResults.find(r => r.ruleName === "APIVersion");
    expect(apiVersionResult).toBeUndefined();
  });

  it("should run a rule when enabled is explicitly set to true", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        APIVersion: {
          enabled: true,
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    
    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("APIVersion");
    expect(results[0].ruleResults[0].occurs).toBe(true);
  });
});