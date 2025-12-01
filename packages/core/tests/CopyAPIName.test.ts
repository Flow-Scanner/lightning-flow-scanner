import * as core from "../src";
import * as path from "path";

import { describe, it, expect } from "@jest/globals";

describe("CopyAPIName ", () => {
  const example_uri = path.join(__dirname, "../../../assets/example-flows/force-app/main/default/flows/demo/Copy_API_Name.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../../../assets/example-flows/force-app/main/default/flows/testing/Copy_API_Name_Fixed.flow-meta.xml");

  it("CopyAPIName should have a result", async () => {
    const flows = await core.parse([example_uri]);
    const ruleConfig = {
      rules: {
        CopyAPIName: {
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);

    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("CopyAPIName");
    expect(results[0].ruleResults[0].occurs).toBe(true);
  });

  it("CopyAPIName should have no result", async () => {
    const flows = await core.parse([fixed_uri]);
    const ruleConfig = {
      rules: {
        CopyAPIName: {
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);

    expect(results[0].ruleResults).toHaveLength(1);
    expect(results[0].ruleResults[0].ruleName).toBe("CopyAPIName");
    expect(results[0].ruleResults[0].occurs).toBe(false);
  });
});
