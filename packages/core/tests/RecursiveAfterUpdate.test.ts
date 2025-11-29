import { describe, expect, it } from "@jest/globals";

import { Flow, RuleResult, scan } from "../src";
import { ParsedFlow } from "../src/main/models/ParsedFlow";
import { RecursiveAfterUpdate } from "../src/main/rules/RecursiveAfterUpdate";

describe("RecursiveAfterUpdate", () => {
  const rule = new RecursiveAfterUpdate();

  describe("e2e", () => {
    it("should trigger from when opt-in", () => {
      const testData: ParsedFlow = {
        flow: {
          elements: [
            {
              element: {
                inputReference: "$Record",
              },
              metaType: "node",
              subtype: "recordUpdates",
            },
          ],
          start: { recordTriggerType: "CreateAndUpdate", triggerType: "RecordAfterSave" },
          type: "AutoLaunchedFlow",
        },
      } as Partial<ParsedFlow> as ParsedFlow;
      const ruleConfig = {
        exceptions: {},
        rules: {
          RecursiveAfterUpdate: {
            severity: "error",
          },
        },
      };
      const results = scan([testData], ruleConfig);
      const scanResults = results.pop();

      expect(
        scanResults?.ruleResults.some(
          (ruleResult) => ruleResult.ruleName === "RecursiveAfterUpdate"
        )
      ).toBeTruthy();
      expect(
        scanResults?.ruleResults?.find(
          (ruleResult) => ruleResult.ruleName === "RecursiveAfterUpdate"
        )?.occurs
      ).toBeTruthy();
    });
  });

  describe("units", () => {
    describe("when using inputReference as $Record", () => {
      it("should trigger when matching record input reference", () => {
        const testData: ParsedFlow = {
          flow: {
            elements: [
              {
                element: {
                  inputReference: "$Record",
                },
                metaType: "node",
                subtype: "recordUpdates",
              },
            ],
            start: { recordTriggerType: "CreateAndUpdate", triggerType: "RecordAfterSave" },
          },
        } as Partial<ParsedFlow> as ParsedFlow;

        const ruleResult: RuleResult = rule.execute(testData.flow as Flow);
        expect(ruleResult.occurs).toBe(true);
      });

      it("should not trigger when not matching record input reference", () => {
        const testData: ParsedFlow = {
          flow: {
            elements: [
              {
                element: {
                  inputReference: "SomethingElse",
                },
                metaType: "node",
                subtype: "recordUpdates",
              },
            ],
            start: { recordTriggerType: "CreateAndUpdate", triggerType: "RecordAfterSave" },
          },
        } as Partial<ParsedFlow> as ParsedFlow;

        const ruleResult: RuleResult = rule.execute(testData.flow as Flow);
        expect(ruleResult.occurs).toBe(false);
      });
    });

    describe("when using inputReference as lookup element", () => {
      it("should trigger when inferred type matches inputReference", () => {
        const testData: ParsedFlow = {
          flow: {
            elements: [
              {
                element: {
                  object: "Case",
                },
                metaType: "node",
                name: "lookupElement",
                subtype: "recordLookups",
              },
              {
                element: {
                  inputReference: "lookupElement",
                },
                metaType: "node",
                subtype: "recordUpdates",
              },
            ],
            start: {
              object: "Case",
              recordTriggerType: "CreateAndUpdate",
              triggerType: "RecordAfterSave",
            },
          },
        } as Partial<ParsedFlow> as ParsedFlow;

        const ruleResult: RuleResult = rule.execute(testData.flow as Flow);
        expect(ruleResult.occurs).toBe(true);
      });

      it("should not trigger when no matching inferred reference", () => {
        const testData: ParsedFlow = {
          flow: {
            elements: [
              {
                element: {
                  object: "Case",
                },
                metaType: "node",
                name: "lookupElement",
                subtype: "recordLookups",
              },
              {
                element: {
                  inputReference: "SomethingElse",
                },
                metaType: "node",
                subtype: "recordUpdates",
              },
            ],
            start: {
              object: "Case",
              recordTriggerType: "CreateAndUpdate",
              triggerType: "RecordAfterSave",
            },
          },
        } as Partial<ParsedFlow> as ParsedFlow;

        const ruleResult: RuleResult = rule.execute(testData.flow as Flow);
        expect(ruleResult.occurs).toBe(false);
      });
    });
  });
});
