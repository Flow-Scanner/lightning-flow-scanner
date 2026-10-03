import { describe, expect, it } from "@jest/globals";
import * as path from "path";

import * as core from "../src";

const jsonRuleConfig = {
  ruleMode: "isolated",
  rules: {
    DuplicateDMLOperation: {
      severity: "error",
    },
  },
};

// Mirrors the shape produced by the Salesforce app when it fetches
// Flow.Metadata via the Tooling API - booleans are real booleans, not the
// "true"/"false" strings XML parsing yields.
function buildJsonFlow(screens: Record<string, unknown>[]): core.Flow {
  const flowObj = {
    label: "Duplicate DML Operation JSON",
    processType: "Flow",
    status: "Active",
    recordCreates: {
      name: "createAccount",
      label: "createAccount",
      connector: { targetReference: screens[0].name },
      inputAssignments: { field: "Name", value: { elementReference: "account_name" } },
      object: "Account",
      storeOutputAutomatically: true,
    },
    screens,
    start: {
      connector: { targetReference: "createAccount" },
    },
  };
  return new core.Flow("json-test-flow", flowObj);
}

describe("DuplicateDMLOperation  ", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/demo/Duplicate_DML_Operation.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../../../example-flows/force-app/testing/Duplicate_DML_Operation_Fixed.flow-meta.xml");

  it("should have 1 result in a flow with a DML statement inbetween screens ", async () => {
    const flows = await core.parse([example_uri]);

    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        DuplicateDMLOperation: {
          severity: "error",
        },
      },
    };
    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("DuplicateDMLOperation");
  });

  it("should have no results in the fixed example", async () => {
    const flows = await core.parse([fixed_uri]);

    const ruleConfig = {
      ruleMode: "isolated",
      rules: {
        DuplicateDMLOperation: {
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });

  it("should report a violation for a JSON-sourced flow with real boolean allowBack/showFooter", async () => {
    const flow = buildJsonFlow([
      {
        name: "mock_screen_1",
        label: "mock screen 1",
        allowBack: true,
        showFooter: true,
      },
    ]);
    const parsedFlow = new core.ParsedFlow("json-test-flow", flow);

    const results: core.ScanResult[] = core.scan([parsedFlow], jsonRuleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("DuplicateDMLOperation");
  });

  it("should reset the seen-DML flag on a JSON-sourced back-disabled screen (real boolean false)", async () => {
    const flow = buildJsonFlow([
      {
        name: "mock_screen_1",
        label: "mock screen 1",
        allowBack: false,
        showFooter: true,
        connector: { targetReference: "mock_screen_2" },
      },
      {
        name: "mock_screen_2",
        label: "mock screen 2",
        allowBack: true,
        showFooter: true,
      },
    ]);
    const parsedFlow = new core.ParsedFlow("json-test-flow", flow);

    const results: core.ScanResult[] = core.scan([parsedFlow], jsonRuleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });
});
