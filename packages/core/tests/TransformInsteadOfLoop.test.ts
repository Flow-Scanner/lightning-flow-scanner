import { describe, expect, it } from "@jest/globals";
import * as path from "path";
import * as core from "../src";

describe("TransformInsteadOfLoop", () => {
  const violating_uri = path.join(
    __dirname,
    "../../../assets/example-flows/force-app/main/default/flows/testing/Loop_Assignment_Pattern.flow-meta.xml"
  );

  it("should flag loop that connects directly to assignment", async () => {
    const flows = await core.parse([violating_uri]);
    expect(flows.length).toBeGreaterThan(0);
    
    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        TransformInsteadOfLoop: {
          severity: "note"
        }
      }
    };
    
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results.length).toBeGreaterThan(0);
    
    const ruleResult = results[0].ruleResults.find(r => r.ruleName === "TransformInsteadOfLoop");
    expect(ruleResult).toBeDefined();
    expect(ruleResult.occurs).toBe(true);
    expect(ruleResult.details.length).toBeGreaterThan(0);
  });
});