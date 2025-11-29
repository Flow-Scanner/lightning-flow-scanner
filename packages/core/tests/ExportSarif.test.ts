import { describe, expect, it } from "@jest/globals";
import * as path from "path";
import * as core from "../src";

describe("exportSarif()", () => {
  const badFlowPath = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/demo/DML_Statement_In_A_Loop.flow-meta.xml");
  const goodFlowPath = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/testing/Duplicate_DML_Operation_Fixed.flow-meta.xml");
  const config = {
    rules: {
      DMLStatementInLoop: { severity: "error" },
    },
  };
  it("generates valid SARIF with real file path and line numbers", async () => {
    const flows = await core.parse([badFlowPath]);
    const results = core.scan(flows, config);
    const sarif = core.exportSarif(results);
   
    const json = JSON.parse(sarif);
    // SARIF structure
    expect(json.version).toBe("2.1.0");
    expect(json.runs).toHaveLength(1);
    expect(json.runs[0].tool.driver.name).toBe("Lightning Flow Scanner");
    // Artifacts: real path (relative or absolute containing the substring)
    const artifactUri = json.runs[0].artifacts[0].location.uri;
    expect(artifactUri).toContain("force-app/main/default/flows/demo/DML_Statement_In_A_Loop.flow-meta.xml");
    // Results: one issue
    const resultsArray = json.runs[0].results;
    expect(resultsArray).toHaveLength(1);
    expect(resultsArray[0].ruleId).toBe("DMLStatementInLoop");
    expect(resultsArray[0].level).toBe("error");
    // Location: has region
    const region = resultsArray[0].locations[0].physicalLocation.region;
    expect(region).toBeDefined();
    expect(typeof region.startLine).toBe("number");
    expect(typeof region.startColumn).toBe("number");
    expect(region.startLine).toBeGreaterThanOrEqual(1);
    expect(region.startColumn).toBeGreaterThanOrEqual(1);
    // Message
    expect(resultsArray[0].message.text).toContain("createNewCase");
  });
  it("generates empty results for fixed flow", async () => {
    const flows = await core.parse([goodFlowPath]);
    const results = core.scan(flows, config);
    const sarif = core.exportSarif(results);
   
    const json = JSON.parse(sarif);
    expect(json.runs[0].results).toHaveLength(0);
  });
  it("falls back to virtual URI when no fsPath", async () => {
    const flows = await core.parse([badFlowPath]);
    // Simulate browser: remove fsPath and set virtual uri with subdir structure
    flows[0].flow.fsPath = undefined;
    flows[0].flow.uri = "flows/demo/DML_Statement_In_A_Loop.flow-meta.xml";
    const results = core.scan(flows, config);
    const sarif = core.exportSarif(results);
    const json = JSON.parse(sarif);
   
    const uri = json.runs[0].artifacts[0].location.uri;
    expect(uri).toBe("flows/demo/DML_Statement_In_A_Loop.flow-meta.xml");
  });
});