import { describe, expect, it } from "@jest/globals";
import * as path from "path";
import * as core from "../src";

describe("MissingRecordTriggerFilter", () => {
  const violating_uri = path.join(
    __dirname,
    "../../../assets/example-flows/force-app/main/default/flows/demo/TriggerWithoutFilter.flow-meta.xml"
  );
  
  const fixed_uri = path.join(
    __dirname,
    "../../../assets/example-flows/force-app/main/default/flows/testing/TriggerWithoutFilter_Fixed.flow-meta.xml"
  );

  it("should return a violation for flow without filters", async () => {
    const flows = await core.parse([violating_uri]);
    expect(flows.length).toBeGreaterThan(0);
    const ruleConfig = {
      ruleMode: "isolated",
      betamode: true,
      rules: {
        MissingFilterRecordTrigger: {
          severity: "warning"
        }
      }
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results.length).toBeGreaterThan(0);
    const ruleResult = results[0].ruleResults.find(r => r.ruleName === "MissingFilterRecordTrigger");
    expect(ruleResult).toBeDefined();
    expect(ruleResult.occurs).toBe(true);
    expect(ruleResult.details.length).toBeGreaterThan(0);
  });

  it("should not return a result for flow with filters", async () => {
    const flows = await core.parse([fixed_uri]);
    expect(flows.length).toBeGreaterThan(0);
    const ruleConfig = {
      ruleMode: "isolated",
      betamode: true,
      rules: {
        MissingFilterRecordTrigger: {
          severity: "warning"
        }
      }
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results.length).toBeGreaterThan(0);
    const ruleResult = results[0].ruleResults.find(r => r.ruleName === "MissingFilterRecordTrigger");
    expect(ruleResult).toBeDefined();
    expect(ruleResult.occurs).toBe(false);
  });
});