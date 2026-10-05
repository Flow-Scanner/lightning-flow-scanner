import * as core from "../src";
import * as path from "path";
import { ParsedFlow } from "../src/main/models/ParsedFlow";

import { describe, it, expect } from "@jest/globals";

describe("Autolayout", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/demo/Demo_No_Auto_Layout.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../../../example-flows/force-app/testing/Outdated_API_Version_Fixed.flow-meta.xml");

  it("should have a result when CanvasMode is set to FREE_FORM_CANVAS", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        AutoLayout: {
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults.find((res) => res.ruleName === "AutoLayout")).toBeTruthy();
  });

  it("should not have result when autolayout is configured", async () => {
    const flows = await core.parse([fixed_uri]);
    const ruleConfig = {
      rules: {
        ruleMode: "isolated",
        AutoLayout: {
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });

  it("should fix missing auto-layout by adding CanvasMode metadata", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        AutoLayout: {
          severity: "error",
        },
      },
    };

    // Scan and fix
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults.find((r) => r.ruleName === "AutoLayout")?.occurs).toBe(true);

    const fixedResults = core.fix(results);
    expect(fixedResults).toHaveLength(1);

    // Verify the fixed flow has AUTO_LAYOUT_CANVAS set
    const fixedFlow = fixedResults[0].flow;
    const canvasMode = fixedFlow.xmldata.processMetadataValues.find(
      (mdv: any) => mdv.name === "CanvasMode"
    );
    expect(canvasMode).toBeDefined();
    expect(canvasMode.value.stringValue).toBe("AUTO_LAYOUT_CANVAS");

    // Verify the fixed flow passes the scan
    const parsedFixedFlow = new ParsedFlow(example_uri, fixedFlow);
    const reScannedResults = core.scan([parsedFixedFlow], ruleConfig);
    const autoLayoutResult = reScannedResults[0].ruleResults.find((r) => r.ruleName === "AutoLayout");
    expect(autoLayoutResult?.occurs).toBe(false);
  });
});
