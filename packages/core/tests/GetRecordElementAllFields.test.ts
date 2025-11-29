import { ParsedFlow } from "../src/main/models/ParsedFlow";
import { RuleResult, Flow, scan, ScanResult } from "../src";
import { GetRecordAllFields } from "../src/main/rules/GetRecordAllFields";

import { describe, it, expect } from "@jest/globals";

describe("GetRecordAllFields", () => {
  it("should be defined", () => {
    expect(GetRecordAllFields).toBeDefined();
  });

  let rule: GetRecordAllFields;
  beforeEach(() => {
    rule = new GetRecordAllFields();
  });

  describe("e2e", () => {
    it("should be empty when no Get Record elements are present", () => {
      const config = {
        rules: {
          GetRecordAllFields: {
            severity: "error",
          },
        },
      };

      const flows: ParsedFlow[] = [
        {
          flow: {
            type: "AutoLaunchedFlow",
          },
        } as Partial<ParsedFlow> as ParsedFlow,
      ];

      const results: ScanResult[] = scan(flows, config);
      const scanResults = results.pop();
      const ruleResults = scanResults?.ruleResults.filter((rule) => {
        return rule.ruleDefinition.name === "GetRecordAllFields" && rule.occurs;
      });
      expect(ruleResults).toHaveLength(0);
    });

    it("should error when getRecord element has storeOutputAutomatically", () => {
      const config = {
        rules: {
          GetRecordAllFields: {
            severity: "error",
          },
        },
      };

      const flows: ParsedFlow[] = [
        {
          flow: {
            type: "AutoLaunchedFlow",
            elements: [
              {
                name: "GetRecord",
                subtype: "recordLookups",
                metaType: "node",
                element: {
                  storeOutputAutomatically: true,
                },
              },
            ],
          },
        } as Partial<ParsedFlow> as ParsedFlow,
      ];

      const results: ScanResult[] = scan(flows, config);
      const scanResults = results.pop();
      const ruleResults = scanResults?.ruleResults.filter((rule) => {
        return rule.ruleDefinition.name === "GetRecordAllFields" && rule.occurs;
      });
      expect(ruleResults).toHaveLength(1);
    });
  });

  describe("empty unit", () => {
    it("should be empty results when no Get Record elements are present", () => {
      const flow: Flow = {
        type: "AutoLaunchedFlow",
      } as Partial<Flow> as Flow;
      const result: RuleResult = rule.execute(flow);
      expect(result.occurs).toBeFalsy();
    });

    it("should be empty when no qualified node", () => {
      const flow: Flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "GetRecord",
            subtype: "recordLookups",
            metaType: "node",
            element: "attribute",
          },
        ],
      } as Partial<Flow> as Flow;
      const result: RuleResult = rule.execute(flow);
      expect(result.occurs).toBeFalsy();
    });

    it("should be empty when outputReference and queriedFields are present", () => {
      const flow: Flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "GetRecord",
            subtype: "recordLookups",
            metaType: "node",
            element: {
              queriedFields: ["Id", "AccountId"],
              outputReference: "outputReference",
            },
          },
        ],
      } as Partial<Flow> as Flow;
      const result: RuleResult = rule.execute(flow);
      expect(result.occurs).toBeFalsy();
    });

    it("should be empty when outputAssignments are present", () => {
      const flow: Flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "GetRecord",
            subtype: "recordLookups",
            metaType: "node",
            element: {
              outputAssignments: [{ assignToReference: "testVar", field: "AccountId" }],
            },
          },
        ],
      } as Partial<Flow> as Flow;
      const result: RuleResult = rule.execute(flow);
      expect(result.occurs).toBeFalsy();
    });

    it("should be empty when storeOutputAutomatically and queriedFields", () => {
      const flow: Flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "GetRecord",
            subtype: "recordLookups",
            metaType: "node",
            element: {
              storeOutputAutomatically: true,
              queriedFields: ["Id", "AccountId"],
            },
          },
        ],
      } as Partial<Flow> as Flow;
      const result: RuleResult = rule.execute(flow);
      expect(result.occurs).toBeFalsy();
    });
  });

  describe("error unit", () => {
    it("should error when Get Record element has storeOutputAutomatically and no queriedFields", () => {
      const flow: Flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "GetRecord",
            subtype: "recordLookups",
            metaType: "node",
            element: {
              storeOutputAutomatically: true,
            },
          },
        ],
      } as Partial<Flow> as Flow;
      const result: RuleResult = rule.execute(flow);
      expect(result.occurs).toBe(true);
    });
  });
});
