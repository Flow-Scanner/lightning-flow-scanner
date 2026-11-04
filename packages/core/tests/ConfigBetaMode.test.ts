import { describe, expect, it } from "@jest/globals";
import * as path from "path";

import * as core from "../src";

const GRADUATED_RULES = [
  "CognitiveComplexity",
  "HardcodedSecret",
  "MissingMetadataDescription",
  "MissingRecordTriggerFilter",
  "MissingStartReference",
  "RecordIdAsString",
  "TransformInsteadOfLoop",
];

describe("Beta Rule Handling", () => {
  const example_uri1 = path.join(__dirname, "../../../example-flows/force-app/demo/Demo_Unreachable.flow-meta.xml");

  it("includes graduated rules in the default ruleset", async () => {
    const flows = await core.parse([example_uri1]);
    const results = core.scan(flows, { betaMode: false });
    const ruleNames = results[0].ruleResults.map(r => r.ruleName);

    for (const ruleName of GRADUATED_RULES) {
      expect(ruleNames).toContain(ruleName);
    }
  });

  it("runs the same rules with or without betaMode when none are in beta", () => {
    const defaultIds = core.getRules().map(rule => rule.ruleId).sort();
    const betaIds = core.getRules(undefined, { betaMode: true }).map(rule => rule.ruleId).sort();
    expect(betaIds).toEqual(defaultIds);
  });
});
