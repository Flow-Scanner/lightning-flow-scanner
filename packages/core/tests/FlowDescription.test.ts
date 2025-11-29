import * as core from "../src";
import * as path from "path";

import { describe, it, expect } from "@jest/globals";

describe("FlowDescription", () => {
  const example_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/demo/Missing_Flow_Description.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/testing/Missing_Flow_Description_Fixed.flow-meta.xml");

  it("should return a result when missing a description", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        FlowDescription: {
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("FlowDescription");
  });

  it("should have no result when provided a description", async () => {
    const flows = await core.parse([fixed_uri]);
    const ruleConfig = {
      rules: {
        FlowDescription: {
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);

    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("FlowDescription");
    expect(results[0].ruleResults[0].occurs).toBe(false);
  });
});
