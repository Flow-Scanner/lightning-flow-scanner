import { describe, it, expect } from "@jest/globals";
import * as path from "path";

import * as core from "../src";

describe("MissingMetadataDescription", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/testing/Missing_Metadata_Description.flow-meta.xml");

  it("there should be 1 results for the rule MissingMetadataDescription", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      ruleMode: "isolated",
      betamode: true,
      rules: {
        MissingMetadataDescription: {
          severity: "error",
        },
      },
    }
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults.filter(ruleName => ruleName.ruleName === "MissingMetadataDescription")[0].ruleName).toBe("MissingMetadataDescription");
  });
});
