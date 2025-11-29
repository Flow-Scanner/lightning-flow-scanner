import { describe, it, expect } from "@jest/globals";
import { HardcodedUrl } from "../src/main/rules/HardcodedUrl";
import { Flow, ParsedFlow, ScanResult } from "../src/main/internals/internals";
import { scan } from "../src";

describe("HardcodedUrl", () => {
  it("should be defined", () => {
    expect(HardcodedUrl).toBeDefined();
  });

  let rule: HardcodedUrl;

  beforeEach(() => {
    rule = new HardcodedUrl();
  });

  describe("e2e", () => {
    it("should scan for hardcoded urls", () => {
      const config = {
        rules: {
          HardcodedUrl: {
            severity: "error",
          },
        },
      };

      const parsedFlows: ParsedFlow[] = [
        {
          flow: {
            type: "AutoLaunchedFlow",
            elements: [
              {
                name: "hardcodedUrl",
                subtype: "formulas",
                metaType: "variable",
                element: {
                  name: "hardcodedUrl",
                  dataType: "String",
                  expression:
                    "&quot;https://mydomain.sandbox.my.salesforce.com/&quot;&amp;{!$User.Id}",
                },
              },
            ],
          },
        } as Partial<ParsedFlow> as ParsedFlow,
      ];

      const results: ScanResult[] = scan(parsedFlows, config);
      const scanResults = results.pop();
      const ruleResults = scanResults?.ruleResults.filter((rule) => {
        return rule.ruleDefinition.name === "HardcodedUrl" && rule.occurs;
      });
      expect(ruleResults).toBeTruthy();
      expect(ruleResults).toHaveLength(1);
    });
  });

  describe("empty unit", () => {
    it("should return empty results when flow has no elements", () => {
      const flow = {
        type: "AutoLaunchedFlow",
        elements: [],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);
      expect(result).toBeDefined();
      expect(result.occurs).toBe(false);
    });

    it("should return empty results when flow has no element property", () => {
      const flow = {
        type: "AutoLaunchedFlow",
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);
      expect(result).toBeDefined();
      expect(result.occurs).toBe(false);
    });

    it("should return empty results when url is generic", () => {
      const flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "genericUrl",
            subtype: "formulas",
            metaType: "variable",
            element: {
              name: "genericUrl",
              dataType: "String",
              expression: "&quot;https://www.google.com/&quot;&amp;{!$User.Id}",
            },
          },
        ],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);
      expect(result).toBeDefined();
      expect(result.occurs).toBe(false);
    });

    it("should return empty results when url is like jira", () => {
      const flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "jiraUrl",
            subtype: "formulas",
            metaType: "variable",
            element: {
              name: "jiraUrl",
              dataType: "String",
              expression: "&quot;https://mydomain.atlassian.net/browse/TEST-123",
            },
          },
        ],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);
      expect(result).toBeDefined();
      expect(result.occurs).toBe(false);
    });

    it("should return empty results when url is like confluence", () => {
      const flow = {
        type: "AutoLaunchedFlow",
        elements: [
          {
            name: "confluenceUrl",
            subtype: "formulas",
            metaType: "variable",
            element: {
              name: "confluenceUrl",
              dataType: "String",
              expression:
                "&quot;https://mydomain.atlassian.net/wiki/spaces/TEST/pages/123456789/Test+Page&quot;",
            },
          },
        ],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);
      expect(result).toBeDefined();
      expect(result.occurs).toBe(false);
    });
  });

  describe("error unit", () => {
    describe("flow formula", () => {
      it("should return results when hardcoding sandbox org url", () => {
        const flow = {
          type: "AutoLaunchedFlow",
          elements: [
            {
              name: "hardcodedUrl",
              subtype: "formulas",
              metaType: "variable",
              element: {
                name: "hardcodedUrl",
                dataType: "String",
                expression:
                  "&quot;https://mydomain.sandbox.my.salesforce.com/&quot;&amp;{!$User.Id}",
              },
            },
          ],
        } as Partial<Flow> as Flow;

        const result = rule.execute(flow);
        expect(result).toBeDefined();
        expect(result.occurs).toBe(true);
      });

      it("should return results when hardcoding prod org url", () => {
        const flow = {
          type: "AutoLaunchedFlow",
          elements: [
            {
              name: "hardcodedUrl",
              subtype: "formulas",
              metaType: "variable",
              element: {
                name: "hardcodedUrl",
                dataType: "String",
                expression: "&quot;https://mydomain.my.salesforce.com/&quot;&amp;{!$User.Id}",
              },
            },
          ],
        } as Partial<Flow> as Flow;

        const result = rule.execute(flow);
        expect(result).toBeDefined();
        expect(result.occurs).toBe(true);
      });
    });

    describe("flow variable", () => {
      it("should return results when hardcoding sandbox org url", () => {
        const flow = {
          type: "AutoLaunchedFlow",
          elements: [
            {
              name: "hardcodedFlowVariable",
              subtype: "variables",
              metaType: "variable",
              element: {
                name: "hardcodedFlowVariable",
                dataType: "String",
                isCollection: false,
                isInput: false,
                isOutput: false,
                value: {
                  stringValue: "https://mydomain.sandbox.my.salesforce.com/",
                },
              },
            },
          ],
        } as Partial<Flow> as Flow;

        const result = rule.execute(flow);
        expect(result).toBeDefined();
        expect(result.occurs).toBe(true);
      });

      it("should return results when hardcoding prod org url", () => {
        const flow = {
          type: "AutoLaunchedFlow",
          elements: [
            {
              name: "hardcodedFlowVariable",
              subtype: "variables",
              metaType: "variable",
              element: {
                name: "hardcodedFlowVariable",
                dataType: "String",
                isCollection: false,
                isInput: false,
                isOutput: false,
                value: {
                  stringValue: "https://mydomain.my.salesforce.com/",
                },
              },
            },
          ],
        } as Partial<Flow> as Flow;

        const result = rule.execute(flow);
        expect(result).toBeDefined();
        expect(result.occurs).toBe(true);
      });
    });
  });
});
