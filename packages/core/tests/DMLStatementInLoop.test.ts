import { describe, expect, it } from "@jest/globals";
import * as path from "path";

import * as core from "../src";

describe("DMLStatementInLoop ", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/main/default/flows/demo/DML_Statement_In_A_Loop.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../../../example-flows/force-app/main/default/flows/testing/Duplicate_DML_Operation_Fixed.flow-meta.xml");
  const config = {
    ruleMode: "isolated",
    rules: {
      DMLStatementInLoop: {
        severity: "error",
      },
    },
  };

  it("there should be one result for the rule DMLStatementInLoop", async () => {
    const flows = await core.parse([example_uri]);
    const results: core.ScanResult[] = core.scan(flows, config);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("DMLStatementInLoop");
  });

  it("there should be no result for the rule DMLStatementInLoop", async () => {
    const flows = await core.parse([fixed_uri]);
    const results: core.ScanResult[] = core.scan(flows, config);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });
});
