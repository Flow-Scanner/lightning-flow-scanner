import * as core from "../src";
import * as path from "path";

import { describe, it, expect } from "@jest/globals";

describe("HardcodedId", () => {
  const example_uri = path.join(__dirname, "../../../assets/example-flows/force-app/main/default/flows/demo/Hardcoded_Id.flow-meta.xml");

  it("there should be one result for the rule HardcodedIds", async () => {
    const flows = await core.parse([example_uri]);
    const results: core.ScanResult[] = core.scan(flows);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("HardcodedId");
  });
});
