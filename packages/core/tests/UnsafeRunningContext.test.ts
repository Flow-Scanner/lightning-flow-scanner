import * as core from "../src";
import * as path from "path";

import { parse } from "../src/main/libs/ParseFlows";
import { ParsedFlow } from "../src/main/models/ParsedFlow";

import { describe, it, expect } from "@jest/globals";
import { UnsafeRunningContext } from "../src/main/rules/UnsafeRunningContext";

describe("UnsafeRunningContext", () => {
  const unsafeRunningContext: UnsafeRunningContext = new UnsafeRunningContext();

  it("should have a scan result for without sharing system mode", async () => {
    const unsafeContextTestFile = path.join(
      __dirname,
      "../../../assets/example-flows/force-app/main/default/flows/demo/Unsafe_Running_Context.flow-meta.xml"
    );
    const parsed: ParsedFlow = (await parse([unsafeContextTestFile])).pop() as ParsedFlow;
    const ruleResult: core.RuleResult = unsafeRunningContext.execute(parsed.flow as core.Flow);
    expect(ruleResult.occurs).toBe(true);
    expect(ruleResult.details).not.toHaveLength(0);
    expect(ruleResult.ruleDefinition.severity).toBe("error");
  });

  it("should not have a scan result for with sharing system mode", async () => {
    const unsafeContextTestFile = path.join(
      __dirname,
      "../../../assets/example-flows/force-app/main/default/flows/testing/Unsafe_Running_Context_WithSharing.flow-meta.xml"
    );
    const parsed: ParsedFlow = (await parse([unsafeContextTestFile])).pop() as ParsedFlow;
    const ruleResult: core.RuleResult = unsafeRunningContext.execute(parsed.flow as core.Flow);
    expect(ruleResult.occurs).toBe(false);
    expect(ruleResult.details).toHaveLength(0);
  });

  it("should not have a scan result for default mode", async () => {
    const unsafeContextTestFile = path.join(
      __dirname,
      "../../../assets/example-flows/force-app/main/default/flows/testing/Unsafe_Running_Context_Default.flow-meta.xml"
    );
    const parsed: ParsedFlow = (await parse([unsafeContextTestFile])).pop() as ParsedFlow;
    const ruleResult: core.RuleResult = unsafeRunningContext.execute(parsed.flow as core.Flow);
    expect(ruleResult.occurs).toBe(false);
    expect(ruleResult.details).toHaveLength(0);
  });
});
