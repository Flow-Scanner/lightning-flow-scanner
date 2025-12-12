import * as core from "../src";
import * as path from "path";
import { ParsedFlow } from "../src/main/models/ParsedFlow";

import { describe, it, expect } from "@jest/globals";

describe("UnusedVariable Rule", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/demo/Unused_Variable.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../../../example-flows/force-app/testing/Unused_Variable_Fixed.flow-meta.xml");

  it("there should be a result for unused variables", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        UnusedVariable: {
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
  });

  it("there should be no result for variables used in text elements", async () => {
    const flows = await core.parse([fixed_uri]);
    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        UnusedVariable: {
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });

  it("should fix the unused variable error", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        UnusedVariable: {
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const fixedResults: core.ScanResult[] = core.fix(results);
    const fixedFlow: ParsedFlow = new ParsedFlow(example_uri, fixedResults[0].flow);
    const newResults: core.ScanResult[] = core.scan([fixedFlow], ruleConfig);
    const fixedResultsOccurring = newResults[0].ruleResults.filter((rule) => rule.occurs);
    expect(fixedResultsOccurring).toHaveLength(0);
  });
});
