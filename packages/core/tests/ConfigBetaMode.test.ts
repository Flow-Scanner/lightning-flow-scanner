import { describe, expect, it } from "@jest/globals";
import * as path from "path";

import * as core from "../src";
import { MissingMetadataDescription } from "../src/main/rules/MissingMetadataDescription";

describe("Beta Rule Handling", () => {
  const example_uri1 = path.join(__dirname, "../../../assets/example-flows/force-app/main/default/flows/demo/Unconnected_Element.flow-meta.xml");

  it("should include beta rule when betaMode is true and no rules are specified", async () => {
    const flows = await core.parse([example_uri1]);
    const results = core.scan(flows, { betaMode: true, rules: {} });
    
    // There should be at least 1 rule result (from beta rules)
    expect(results[0].ruleResults.length).toBeGreaterThan(0);
  });

  it("should not include beta rule if betaMode is false even if rule exists in beta", async () => {
    const flows = await core.parse([example_uri1]);
    const results = core.scan(flows, { betaMode: false });
    
    // If the rule is only in beta and betaMode is false, it should not appear
    const ruleNames = results[0].ruleResults.map(r => r.ruleName);
    expect(ruleNames).not.toContain("MissingMetadataDescription");
  });
});
