import * as core from "../src";
import * as path from "path";

import { describe, it, expect } from "@jest/globals";

describe("UnusedVariable Exceptions", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/demo/Demo_Unused_Variable.flow-meta.xml");

  it("should detect unused variable without exceptions", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        "unused-variable": {
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].details[0].name).toBe("anUnusedVariable");
  });

  it("should suppress unused variable with wildcard exception", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        "unused-variable": {
          severity: "error",
        },
      },
      exceptions: {
        Demo_Unused_Variable: {
          "unused-variable": ["*"],
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });

  it("should suppress unused variable with specific variable name exception", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        "unused-variable": {
          severity: "error",
        },
      },
      exceptions: {
        Demo_Unused_Variable: {
          "unused-variable": ["anUnusedVariable"],
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });

  it("should NOT suppress unused variable with empty string exception - bug reproduction", async () => {
    // This test reproduces the reported issue where users configure:
    // exceptions:
    //   Test_Screen_Flow:
    //     unused-variable:
    //       - ""
    // Expecting it to suppress all violations, but it doesn't work.
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        "unused-variable": {
          severity: "error",
        },
      },
      exceptions: {
        Demo_Unused_Variable: {
          "unused-variable": [""],
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    // Current behavior: empty string does NOT suppress - violation still reported
    expect(occurringResults).toHaveLength(1);
  });
});