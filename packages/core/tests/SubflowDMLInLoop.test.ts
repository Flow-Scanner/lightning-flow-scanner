import * as path from "path";
import { parse, scan, PreloadedResolver, Flow } from "../src/index";

const testFlowsDir = path.resolve(__dirname, "../../../example-flows/force-app/testing/subflow-resolution");

describe("Subflow Resolution - DML in Loop Detection", () => {
  let parentFlow: Flow;
  let childFlow: Flow;
  let middleFlow: Flow;
  let nestedParentFlow: Flow;
  let resolver: PreloadedResolver;

  beforeAll(async () => {
    // Parse all flows
    const parentPath = path.join(testFlowsDir, "Parent_With_Subflow_Loop.flow-meta.xml");
    const childPath = path.join(testFlowsDir, "Child_With_DML.flow-meta.xml");
    const middlePath = path.join(testFlowsDir, "Middle_Flow.flow-meta.xml");
    const nestedParentPath = path.join(testFlowsDir, "Parent_With_Nested_Subflow.flow-meta.xml");

    const [parentParsed, childParsed, middleParsed, nestedParentParsed] = await Promise.all([
      parse([parentPath]),
      parse([childPath]),
      parse([middlePath]),
      parse([nestedParentPath]),
    ]);

    parentFlow = parentParsed[0].flow!;
    childFlow = childParsed[0].flow!;
    middleFlow = middleParsed[0].flow!;
    nestedParentFlow = nestedParentParsed[0].flow!;

    // Create resolver with all flows pre-loaded
    resolver = new PreloadedResolver();
    resolver.addFlow("Child_With_DML", childFlow);
    resolver.addFlow("Middle_Flow", middleFlow);
  });

  describe("Flow structure validation", () => {
    it("parent flow should have a subflow reference", () => {
      expect(parentFlow.hasSubflows()).toBe(true);
      expect(parentFlow.getSubflowNames()).toContain("Child_With_DML");
    });

    it("parent flow should have a loop", () => {
      const loops = parentFlow.elements.filter(e => e.subtype === "loops");
      expect(loops.length).toBe(1);
    });

    it("child flow should have a DML operation", () => {
      const dmlOps = childFlow.elements.filter(e =>
        e.subtype === "recordCreates" ||
        e.subtype === "recordUpdates" ||
        e.subtype === "recordDeletes"
      );
      expect(dmlOps.length).toBeGreaterThan(0);
    });

    it("resolver should have the child flow", () => {
      expect(resolver.has("Child_With_DML")).toBe(true);
    });
  });

  describe("Scanning without subflow resolution", () => {
    it("should NOT flag DML-in-loop for parent flow alone", () => {
      const results = scan([{ flow: parentFlow }], {
        rules: { "DMLStatementInLoop": { severity: "error" } },
      });

      const dmlInLoopViolations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "dml-in-loop" && rr.occurs);

      // Without subflow resolution, we can't see into the subflow
      expect(dmlInLoopViolations.length).toBe(0);
    });
  });

  describe("Scanning WITH subflow resolution", () => {
    it("resolver can resolve the child flow", async () => {
      const resolved = await resolver.resolve("Child_With_DML");
      expect(resolved.flow).toBeDefined();
      expect(resolved.flow?.name).toBe("Child_With_DML");
    });

    it("should flag DML-in-loop when subflow resolution is enabled", () => {
      const results = scan([{ flow: parentFlow }], {
        rules: { "DMLStatementInLoop": { severity: "error" } },
        subflowResolver: resolver,
      });

      const dmlInLoopViolations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "dml-in-loop" && rr.occurs);

      // With subflow resolution, the rule should detect that
      // Call_Child_Flow (inside Loop_Accounts) invokes a flow containing DML
      expect(dmlInLoopViolations.length).toBeGreaterThan(0);

      // The violation should be on the subflow call node
      const violation = dmlInLoopViolations[0].details[0];
      expect(violation.name).toBe("Call_Child_Flow");
      expect(violation.referencedFlow).toBe("Child_With_DML");
      expect(violation.referencedElement).toBe("Create_Task");
    });
  });

  describe("Child flow standalone scan", () => {
    it("child flow should NOT have DML-in-loop on its own (no loop)", () => {
      const results = scan([{ flow: childFlow }], {
        rules: { "DMLStatementInLoop": { severity: "error" } },
      });

      const dmlInLoopViolations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "dml-in-loop" && rr.occurs);

      // Child flow has DML but no loop, so no violation
      expect(dmlInLoopViolations.length).toBe(0);
    });
  });

  describe("Nested subflow resolution (recursive)", () => {
    it("should detect DML in nested subflow chain: Parent -> Middle -> Child", () => {
      const results = scan([{ flow: nestedParentFlow }], {
        rules: { "DMLStatementInLoop": { severity: "error" } },
        subflowResolver: resolver,
      });

      const dmlInLoopViolations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "dml-in-loop" && rr.occurs);

      // Should detect DML through: Loop -> Middle_Flow -> Child_With_DML -> Create_Task
      expect(dmlInLoopViolations.length).toBeGreaterThan(0);

      // Violation should be on the subflow call node in the loop
      const violation = dmlInLoopViolations[0].details[0];
      expect(violation.name).toBe("Call_Middle_Flow");

      // Should show the full call chain
      expect(violation.callChain).toEqual(["Middle_Flow", "Child_With_DML"]);
      expect(violation.referencedElement).toBe("Create_Task");
    });

    it("should handle missing flows in chain gracefully", () => {
      // Create resolver with only middle flow (missing child)
      const incompleteResolver = new PreloadedResolver();
      incompleteResolver.addFlow("Middle_Flow", middleFlow);
      // Note: Child_With_DML is NOT added

      const results = scan([{ flow: nestedParentFlow }], {
        rules: { "DMLStatementInLoop": { severity: "error" } },
        subflowResolver: incompleteResolver,
      });

      const dmlInLoopViolations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "dml-in-loop" && rr.occurs);

      // Should not crash, but also shouldn't find the violation since child is missing
      expect(dmlInLoopViolations.length).toBe(0);
    });

    it("should prevent infinite loops with circular subflow references", () => {
      // Create a circular reference: Flow_A -> Flow_B -> Flow_A
      const flowA = new Flow("Circular_A", {
        label: "Circular A",
        processType: "AutoLaunchedFlow",
        status: "Active",
        loops: [{
          name: "Loop1",
          nextValueConnector: { targetReference: "CallB" },
          noMoreValuesConnector: { targetReference: "End" },
        }],
        subflows: [{
          name: "CallB",
          flowName: "Circular_B",
          connector: { targetReference: "Loop1" },
        }],
        assignments: [{ name: "End" }],
      });

      const flowB = new Flow("Circular_B", {
        label: "Circular B",
        processType: "AutoLaunchedFlow",
        status: "Active",
        subflows: [{
          name: "CallA",
          flowName: "Circular_A", // Circular reference back to A
        }],
        recordCreates: [{
          name: "CreateRecord",
          object: "Account",
        }],
      });

      const circularResolver = new PreloadedResolver();
      circularResolver.addFlow("Circular_A", flowA);
      circularResolver.addFlow("Circular_B", flowB);

      // Should not hang or crash
      const results = scan([{ flow: flowA }], {
        rules: { "DMLStatementInLoop": { severity: "error" } },
        subflowResolver: circularResolver,
      });

      const dmlInLoopViolations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "dml-in-loop" && rr.occurs);

      // Should find the DML in Circular_B (visited once before cycle detected)
      expect(dmlInLoopViolations.length).toBe(1);
    });
  });
});
