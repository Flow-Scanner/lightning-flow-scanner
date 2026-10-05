import * as core from "../src";
import * as path from "path";

import { describe, it, expect, beforeEach } from "@jest/globals";
import { HardcodedId } from "../src/main/rules/HardcodedId";
import { Flow, ParsedFlow, ScanResult } from "../src/main/internals/internals";
import { scan } from "../src";

describe("HardcodedId", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/demo/Demo_Hardcoded_Id.flow-meta.xml");

  it("there should be one result for the rule HardcodedIds", async () => {
    const flows = await core.parse([example_uri]);
    const results: core.ScanResult[] = core.scan(flows);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("HardcodedId");
  });

  describe("description field", () => {
    let rule: HardcodedId;

    beforeEach(() => {
      rule = new HardcodedId();
    });

    it("should NOT flag IDs in description field (bug fix: false positives from documentation)", () => {
      // This test verifies the fix for the bug where IDs in <description> tags
      // were being flagged as hardcoded IDs. These are documentation URLs/references
      // and should be ignored.
      const flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "Save_Application_Event",
            subtype: "actionCalls",
            metaType: "node",
            element: {
              description: "Saves the Application Event. See https://ideas.salesforce.com/s/idea/a0B8W00000J8A6cUAF/long-text-areas-in-flow",
              name: "Save_Application_Event",
              label: "Save Application Event",
              actionName: "rflib_SaveAppEventOccurrenceAction",
              actionType: "apex",
            },
          },
        ],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);
      expect(result).toBeDefined();
      expect(result.occurs).toBe(false);
    });

    it("should still flag IDs in actual flow values (not in description)", () => {
      const flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "testElement",
            subtype: "recordLookups",
            metaType: "node",
            element: {
              description: "Safe description without IDs",
              name: "testElement",
              filterLogic: "and",
              filters: [
                {
                  field: "Id",
                  operator: "EqualTo",
                  value: {
                    stringValue: "a0B8W00000J8A6cUAF", // This should be flagged
                  },
                },
              ],
            },
          },
        ],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);
      expect(result).toBeDefined();
      expect(result.occurs).toBe(true);
    });

    it("should handle e2e scan with description containing ID", () => {
      const config = {
        rules: {
          HardcodedId: {
            severity: "error",
          },
        },
      };

      const parsedFlows: ParsedFlow[] = [
        {
          flow: {
            type: "AutoLaunchedFlow",
            status: "Active",
            elements: [
              {
                name: "Save_Application_Event",
                subtype: "actionCalls",
                metaType: "node",
                element: {
                  description: "See https://ideas.salesforce.com/s/idea/a0B8W00000J8A6cUAF",
                  name: "Save_Application_Event",
                  label: "Save Application Event",
                  actionName: "myAction",
                  actionType: "apex",
                },
              },
            ],
          },
        } as Partial<ParsedFlow> as ParsedFlow,
      ];

      const results: ScanResult[] = scan(parsedFlows, config);
      const scanResults = results.pop();
      const ruleResults = scanResults?.ruleResults.filter((rule) => {
        return rule.ruleDefinition.name === "HardcodedId" && rule.occurs;
      });
      expect(ruleResults).toHaveLength(0);
    });
  });
});
