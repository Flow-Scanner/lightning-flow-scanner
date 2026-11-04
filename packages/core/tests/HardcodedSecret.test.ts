import * as core from "../src";
import * as path from "path";

import { describe, it, expect } from "@jest/globals";

describe("HardcodedSecret", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/testing/Hardcoded_Secret.flow-meta.xml");

  it("is included in the default ruleset", async () => {
    const flows = await core.parse([example_uri]);
    const results: core.ScanResult[] = core.scan(flows);
    const ruleNames = results[0].ruleResults.map((r) => r.ruleName);
    expect(ruleNames).toContain("HardcodedSecret");
  });

  it("should detect Stripe secret key in flow variable", async () => {
    const flows = await core.parse([example_uri]);
    const results: core.ScanResult[] = core.scan(flows);
    const secretRule = results[0].ruleResults.find((r) => r.ruleName === "HardcodedSecret");

    expect(secretRule).toBeDefined();
    expect(secretRule!.occurs).toBe(true);
    expect(secretRule!.details.length).toBeGreaterThan(0);
  });
});
