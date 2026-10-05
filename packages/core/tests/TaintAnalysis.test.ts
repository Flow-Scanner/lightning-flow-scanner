import * as path from "path";
import { parse, scan, PreloadedResolver, Flow } from "../src/index";
import { FlowDataFlow } from "../src/main/models/FlowDataFlow";
import { TaintAnalyzer, runsWithoutSharing } from "../src/main/libs/TaintAnalyzer";

const taintDir = path.resolve(
  __dirname,
  "../../../example-flows/force-app/testing/taint"
);

async function load(file: string): Promise<Flow> {
  const parsed = await parse([path.join(taintDir, file)]);
  return parsed[0].flow!;
}

const RULE_ID = "prevent-passing-user-data-into-element-with-sharing";

describe("TaintAnalyzer", () => {
  let parentUnsafe: Flow;
  let parentSafe: Flow;
  let childNoSharing: Flow;
  let childSafe: Flow;
  let resolver: PreloadedResolver;

  beforeAll(async () => {
    parentUnsafe = await load("Taint_Parent_Unsafe.flow-meta.xml");
    parentSafe = await load("Taint_Parent_Safe.flow-meta.xml");
    childNoSharing = await load("Taint_Child_NoSharing.flow-meta.xml");
    childSafe = await load("Taint_Child_Safe.flow-meta.xml");

    resolver = new PreloadedResolver();
    resolver.addFlow("Taint_Child_NoSharing", childNoSharing);
    resolver.addFlow("Taint_Child_Safe", childSafe);
  });

  it("detects a without-sharing running mode", () => {
    expect(runsWithoutSharing(childNoSharing)).toBe(true);
    expect(runsWithoutSharing(childSafe)).toBe(false);
  });

  it("marks the screen input as a taint source", () => {
    const df = new FlowDataFlow(parentUnsafe);
    expect(df.getScreenInputs().has("UserInput")).toBe(true);
    // The subflow boundary carries the tainted caller reference into the callee var.
    const boundary = df.getSubflowBoundary("Call_NoSharing_Child");
    expect(boundary?.inputs).toEqual([
      { calleeVar: "childInput", callerRefs: ["UserInput"] },
    ]);
  });

  it("flags user data passed into a without-sharing subflow", () => {
    const df = new FlowDataFlow(parentUnsafe);
    const analyzer = new TaintAnalyzer(resolver);
    const findings = analyzer.findViolations(parentUnsafe, df);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      nodeName: "Call_NoSharing_Child",
      kind: "cross-sharing",
      targetFlow: "Taint_Child_NoSharing",
      taintedVariables: ["childInput"],
    });
  });

  it("does NOT flag user data passed into a with-sharing subflow", () => {
    const df = new FlowDataFlow(parentSafe);
    const analyzer = new TaintAnalyzer(resolver);
    const findings = analyzer.findViolations(parentSafe, df);
    expect(findings).toHaveLength(0);
  });

  it("does not flag cross-subflow risk without a resolver", () => {
    const df = new FlowDataFlow(parentUnsafe);
    const analyzer = new TaintAnalyzer(); // no resolver
    const findings = analyzer.findViolations(parentUnsafe, df);
    expect(findings).toHaveLength(0);
  });
});

describe("PreventPassingUserDataIntoElementWithSharing rule", () => {
  it("raises an error violation on the subflow call node (via scan, betaMode)", async () => {
    const parentUnsafe = await load("Taint_Parent_Unsafe.flow-meta.xml");
    const childNoSharing = await load("Taint_Child_NoSharing.flow-meta.xml");

    const resolver = new PreloadedResolver();
    resolver.addFlow("Taint_Child_NoSharing", childNoSharing);

    const results = scan([{ flow: parentUnsafe } as any], {
      betaMode: true,
      rules: {},
      subflowResolver: resolver,
    });

    const ruleResult = results[0].ruleResults.find(
      (r) => r.ruleDefinition.ruleId === RULE_ID
    );
    expect(ruleResult).toBeDefined();
    expect(ruleResult!.details).toHaveLength(1);
    expect(ruleResult!.details[0].name).toBe("Call_NoSharing_Child");
  });

  it("produces no violation for the safe parent", async () => {
    const parentSafe = await load("Taint_Parent_Safe.flow-meta.xml");
    const childSafe = await load("Taint_Child_Safe.flow-meta.xml");

    const resolver = new PreloadedResolver();
    resolver.addFlow("Taint_Child_Safe", childSafe);

    const results = scan([{ flow: parentSafe } as any], {
      betaMode: true,
      rules: {},
      subflowResolver: resolver,
    });

    const ruleResult = results[0].ruleResults.find(
      (r) => r.ruleDefinition.ruleId === RULE_ID
    );
    expect(ruleResult?.details ?? []).toHaveLength(0);
  });
});
