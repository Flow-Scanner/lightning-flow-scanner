import { describe, expect, it } from "@jest/globals";
import * as path from "path";

import * as core from "../src";

describe("SOQLQueryInLoop ", () => {
  const example_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/demo/SOQL_Query_In_A_Loop.flow-meta.xml");

  const config = {
    rules: {
      SOQLQueryInLoop: {
        severity: "error",
      },
    },
  };

  it("there should be one result for the rule SOQLQueryInLoop", async () => {
    const flows = await core.parse([example_uri]);
    const results: core.ScanResult[] = core.scan(flows, config);
    const SOQLQueryInLoop = results[0].ruleResults.find(
      (rule) => rule.occurs && rule.ruleName === "SOQLQueryInLoop"
    );
    expect(SOQLQueryInLoop?.occurs).toBe(true);
  });

  it("there should be no result for the rule SOQLQueryInLoop", async () => {
    const flows = await core.parse([example_uri]);
    const results: core.ScanResult[] = core.scan(flows, config);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toEqual(expect.not.arrayContaining(["SOQLQueryInLoop"]));
  });
});
