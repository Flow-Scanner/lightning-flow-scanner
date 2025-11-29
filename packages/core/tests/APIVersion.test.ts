import * as core from "../src";
import * as path from "path";

import { describe, it, expect } from "@jest/globals";

describe("APIVersion", () => {
  const example_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/demo/Outdated_API_Version.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/testing/Outdated_API_Version_Fixed.flow-meta.xml");

  it("should have a result when attribute is missing", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        APIVersion: {
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("APIVersion");
    expect(results[0].ruleResults[0].occurs).toBe(true);
  });

  it("should have a result when below configured threshold", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        APIVersion: {
          severity: "error",
          expression: ">55",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("APIVersion");
    expect(results[0].ruleResults[0].occurs).toBe(true);
  });

  it("should have no result when version is meeting threshold", async () => {
    const flows = await core.parse([fixed_uri]);
    const ruleConfig = {
      rules: {
        APIVersion: {
          severity: "error",
          expression: ">55",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("APIVersion");
    expect(results[0].ruleResults[0].occurs).toBe(false);
  });

  it("should have a result when configured is more than what the file has", async () => {
    const flows = await core.parse([fixed_uri]);
    const ruleConfig = {
      rules: {
        APIVersion: {
          severity: "error",
          expression: ">=60",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("APIVersion");
    expect(results[0].ruleResults[0].occurs).toBe(true);

    const violations = results[0].ruleResults[0].details;
    if (violations.length > 0) {
      // ensure tag level line numbers are correct
      expect(violations[0].lineNumber).toBeDefined();
      expect(violations[0].lineNumber).toBeGreaterThan(1);
    }
  });
});
