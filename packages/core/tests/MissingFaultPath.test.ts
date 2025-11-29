import { describe, expect, it } from "@jest/globals";
import * as path from "path";

import { Flow, parse, RuleResult, scan, ScanResult } from "../src";

describe("MissingFaultPath", () => {
  const exampleUri = path.join(
    __dirname,
    "../assets/example-flows/force-app/main/default/flows/demo/Missing_Error_Handler.flow-meta.xml"
  );
  const fixedUri = path.join(
    __dirname,
    "../assets/example-flows/force-app/main/default/flows/testing/Missing_Error_Handler_Fixed.flow-meta.xml"
  );

  it("should return a result for MissingFaultPath when fault path is missing", async () => {
    const flows: Flow[] = await parse([exampleUri]);
    const config = {
      rules: { MissingFaultPath: { severity: "error" } },
    };
    const results: ScanResult[] = scan(flows, config);
    const occurringResults = results[0].ruleResults.filter((r) => r.occurs);

    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("MissingFaultPath");
  });

  it("should return no result when fault path is implemented", async () => {
    const flows: Flow[] = await parse([fixedUri]);
    const results: ScanResult[] = scan(flows);
    const occurringResults = results[0].ruleResults.filter((r) => r.occurs);

    expect(occurringResults).toHaveLength(0);
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("should not occur when actionName is suppressed", async () => {
    process.env.IS_NEW_SCAN_ENABLED = "true";
    const flows: Flow[] = await parse([exampleUri]);
    const config = {
      rules: {
        MissingFaultPath: { severity: "error", suppressions: ["LogACall"] },
      },
    };
    const results: ScanResult[] = scan(flows, config);
    const occurringResults = results[0].ruleResults.filter((r) => r.occurs);

    expect(occurringResults).toHaveLength(0);
  });
});
