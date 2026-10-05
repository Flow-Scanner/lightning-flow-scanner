import * as path from "path";
import { parse, scanFlat, PreloadedResolver, Flow } from "../src/index";

const testFlowsDir = path.resolve(
  __dirname,
  "../../../example-flows/force-app/testing/subflow-resolution"
);

describe("Flat output (scanFlat / flatten)", () => {
  let parentFlow: Flow;
  let childFlow: Flow;
  let resolver: PreloadedResolver;

  beforeAll(async () => {
    const [parentParsed, childParsed] = await Promise.all([
      parse([path.join(testFlowsDir, "Parent_With_Subflow_Loop.flow-meta.xml")]),
      parse([path.join(testFlowsDir, "Child_With_DML.flow-meta.xml")]),
    ]);
    parentFlow = parentParsed[0].flow!;
    childFlow = childParsed[0].flow!;
    resolver = new PreloadedResolver();
    resolver.addFlow("Child_With_DML", childFlow);
  });

  it("returns one self-contained record per violation", () => {
    const flat = scanFlat([{ flow: parentFlow }], {
      rules: {},
      subflowResolver: resolver,
    });

    expect(flat.length).toBeGreaterThan(0);
    for (const record of flat) {
      // Flow and rule context on every record
      expect(typeof record.flowFile).toBe("string");
      expect(typeof record.flowName).toBe("string");
      expect(typeof record.ruleId).toBe("string");
      expect(typeof record.severity).toBe("string");
      // Violation identity/position on every record
      expect(typeof record.name).toBe("string");
      expect(typeof record.lineNumber).toBe("number");
      // No polymorphic details bag
      expect((record as Record<string, unknown>).details).toBeUndefined();
    }
  });

  it("carries rule-specific fields at the top level, losslessly", () => {
    const flat = scanFlat([{ flow: parentFlow }], {
      rules: {},
      subflowResolver: resolver,
    });

    const crossFlow = flat.find(
      r => r.ruleId === "dml-in-loop" && r.type === "subflows"
    );
    expect(crossFlow).toBeDefined();
    // Pre-v7 exportDetails dropped these; flatten must not
    expect(crossFlow!.referencedFlow).toBe("Child_With_DML");
    expect(crossFlow!.referencedElement).toBe("Create_Task");
    expect(crossFlow!.referencedType).toBe("recordCreates");
  });

  it("keeps element facts (connectsTo, canvas position) on node violations", () => {
    const flat = scanFlat([{ flow: parentFlow }], {
      rules: {},
      subflowResolver: resolver,
    });

    const nodeViolation = flat.find(r => r.metaType === "node" && r.connectsTo);
    expect(nodeViolation).toBeDefined();
    expect(Array.isArray(nodeViolation!.connectsTo)).toBe(true);
  });
});
