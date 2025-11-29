import * as path from "path";
import { describe, it, expect } from "@jest/globals";

import * as core from "../src";
import { CyclomaticComplexity } from "../src/main/rules/CyclomaticComplexity";

describe("CyclomaticComplexity ", () => {
  const example_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/demo/Cyclomatic_Complexity.flow-meta.xml");
  const other_uri = path.join(__dirname, "../assets/example-flows/force-app/main/default/flows/demo/SOQL_Query_In_A_Loop.flow-meta.xml");
  const defaultConfig = {
    rules: {
      CyclomaticComplexity: {
        severity: "error",
      },
    },
  };

  it("should have a result when there are more than 25 decision options", async () => {
    const flows = await core.parse([example_uri]);
    debugger;
    const results: core.ScanResult[] = core.scan(flows, defaultConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("CyclomaticComplexity");
  });

  it("should have no result when value is below threshold", async () => {
    const flows = await core.parse([other_uri]);

    const results: core.ScanResult[] = core.scan(flows, defaultConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(0);
  });

  it("should have a result when value surpasses a configured threshold", async () => {
    const flows = await core.parse([other_uri]);
    const ruleConfig = {
      rules: {
        CyclomaticComplexity: {
          threshold: 1,
          severity: "error",
        },
      },
    };

    const results: core.ScanResult[] = core.scan(flows, ruleConfig);
    const occurringResults = results[0].ruleResults.filter((rule) => rule.occurs);
    expect(occurringResults).toHaveLength(1);
    expect(occurringResults[0].ruleName).toBe("CyclomaticComplexity");
  });

  it("should correctly count the number of decisions and underlying rules one level", () => {
    const sut = new CyclomaticComplexity();
    const raw = {
      elements: [
        {
          subtype: "decisions",
          element: {
            rules: [{}, {}, {}],
          },
        },
      ],
    } as Partial<core.Flow>;
    const given = raw as core.Flow;
    sut.execute(given);
    expect(sut["cyclomaticComplexityUnit"]).toBe(5);
  });

  it("should correctly count the number of decisions and underlying rules multi level", () => {
    const sut = new CyclomaticComplexity();
    const raw = {
      elements: [
        {
          subtype: "decisions",
          element: {
            rules: [{}, {}, {}],
          },
        },
        { subtype: "decisions", element: { rules: [{}] } },
      ],
    } as Partial<core.Flow>;
    const given = raw as core.Flow;
    sut.execute(given);
    expect(sut["cyclomaticComplexityUnit"]).toBe(7);
  });

  it("should not throw an exception when theres no elements at all", () => {
    const sut = new CyclomaticComplexity();
    const raw = {
      elements: [],
    } as Partial<core.Flow>;
    const given = raw as core.Flow;
    expect(() => {
      sut.execute(given);
    }).not.toThrow();
  });

  it("should not throw an exception when element isn't present", () => {
    const sut = new CyclomaticComplexity();
    const raw = {} as Partial<core.Flow>;
    const given = raw as core.Flow;
    expect(() => {
      sut.execute(given);
    }).not.toThrow();
  });

  it("should correctly count the number of loops", () => {
    const sut = new CyclomaticComplexity();
    const raw = {
      elements: [
        {
          subtype: "loops",
        },
        {
          subtype: "loops",
        },
      ],
    } as Partial<core.Flow>;
    const given = raw as core.Flow;
    sut.execute(given);
    expect(sut["cyclomaticComplexityUnit"]).toBe(3);
  });
});
