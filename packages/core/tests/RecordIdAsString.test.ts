import { describe, expect, it } from "@jest/globals";
import * as path from "path";
import * as core from "../src";

describe("RecordIdAsString", () => {
  const violating_uri = path.join(
    __dirname,
    "../../../assets/example-flows/force-app/main/default/flows/testing/RecordId_As_String.flow-meta.xml"
  );

  const fixed_uri = path.join(
    __dirname,
    "../../../assets/example-flows/force-app/main/default/flows/testing/RecordId_As_Record_Fixed.flow-meta.xml"
  );

    it("should flag recordId variable defined as String", async () => {
    const flows = await core.parse([violating_uri]);
    expect(flows.length).toBeGreaterThan(0);
    
    const ruleConfig = {
        ruleMode: "isolated",
        betaMode: true,
        rules: {
        RecordIdAsString: {
            severity: "warning"
        }
        }
    };
    
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results.length).toBeGreaterThan(0);
    
    // Debug output
    console.log("All rule results:", results[0].ruleResults.map(r => r.ruleName));
    
    const ruleResult = results[0].ruleResults.find(r => r.ruleName === "RecordIdAsString");
    expect(ruleResult).toBeDefined();
    expect(ruleResult.occurs).toBe(true);
    expect(ruleResult.details.length).toBeGreaterThan(0);
    });

  it("should not flag recordId variable defined as SObject", async () => {
    const flows = await core.parse([fixed_uri]);
    expect(flows.length).toBeGreaterThan(0);
    
    const ruleConfig = {
      ruleMode: "isolated",
      betaMode: true,
      rules: {
        RecordIdAsString: {
          severity: "warning"
        }
      }
    };
    
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results.length).toBeGreaterThan(0);
    
    const ruleResult = results[0].ruleResults.find(r => r.ruleName === "RecordIdAsString");
    expect(ruleResult).toBeDefined();
    expect(ruleResult.occurs).toBe(false);
  });
});