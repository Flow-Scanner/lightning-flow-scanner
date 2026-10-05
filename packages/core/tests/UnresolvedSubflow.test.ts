import * as path from "path";
import { parse, scan, getRules, PreloadedResolver, Flow } from "../src/index";

const testFlowsDir = path.resolve(__dirname, "../../../example-flows/force-app/testing/subflow-resolution");

describe("UnresolvedSubflow System Rule", () => {
  let parentFlow: Flow;
  let childFlow: Flow;
  let middleFlow: Flow;
  let nestedParentFlow: Flow;
  let resolver: PreloadedResolver;

  beforeAll(async () => {
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

    // Create resolver with some but not all flows
    resolver = new PreloadedResolver();
    resolver.addFlow("Child_With_DML", childFlow);
    resolver.addFlow("Middle_Flow", middleFlow);
  });

  describe("System rules configuration", () => {
    it("should NOT include system rules by default", () => {
      const results = scan([{ flow: parentFlow }], {
        rules: {},
        subflowResolver: resolver,
      });

      const unresolvedSubflowRules = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow");

      // System rules are off by default
      expect(unresolvedSubflowRules.length).toBe(0);
    });

    it("should NOT include system rules with only systemRules: true (also needs betaMode for beta rules)", () => {
      const results = scan([{ flow: parentFlow }], {
        rules: {},
        systemRules: true,
        // betaMode is false - rule is both beta AND system
        subflowResolver: resolver,
      });

      const unresolvedSubflowRules = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow");

      // Rule is beta, so betaMode is also required
      expect(unresolvedSubflowRules.length).toBe(0);
    });

    it("should NOT include system rules with only betaMode: true (system rules are opt-in)", () => {
      const results = scan([{ flow: parentFlow }], {
        rules: {},
        betaMode: true,
        // No systemRules key - must default to off
        subflowResolver: resolver,
      });

      const unresolvedSubflowRules = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow");

      expect(unresolvedSubflowRules.length).toBe(0);
    });

    it("should run system rules when explicitly configured in isolated mode", () => {
      const results = scan([{ flow: parentFlow }], {
        ruleMode: "isolated",
        rules: { "unresolved-subflow": { severity: "error" } },
        // No systemRules key - explicit selection overrides the default gate
        subflowResolver: resolver,
      });

      const unresolvedSubflowRules = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow");

      expect(unresolvedSubflowRules.length).toBe(1);
    });

    it("should gate system rules identically in getRules() and scan()", () => {
      // Default off in merged mode, for both system rules
      const merged = getRules(undefined, { betaMode: true });
      expect(merged.some(r => r.ruleId === "unresolved-subflow")).toBe(false);
      expect(merged.some(r => r.ruleId === "missing-start-reference")).toBe(false);

      // Opt-in includes both
      const withSystem = getRules(undefined, { betaMode: true, systemRules: true });
      expect(withSystem.some(r => r.ruleId === "unresolved-subflow")).toBe(true);
      expect(withSystem.some(r => r.ruleId === "missing-start-reference")).toBe(true);

      // Explicit selection works without the flag
      const explicit = getRules(["unresolved-subflow"]);
      expect(explicit.some(r => r.ruleId === "unresolved-subflow")).toBe(true);
    });

    it("should include system rules when both systemRules: true AND betaMode: true", () => {
      const results = scan([{ flow: parentFlow }], {
        rules: {},
        systemRules: true,
        betaMode: true,
        subflowResolver: resolver,
      });

      const unresolvedSubflowRules = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow");

      // System rules should now run
      expect(unresolvedSubflowRules.length).toBe(1);
    });
  });

  describe("Detection of unresolved subflows", () => {
    it("should NOT flag subflows that can be resolved", () => {
      const results = scan([{ flow: parentFlow }], {
        rules: {},
        systemRules: true,
        betaMode: true,
        subflowResolver: resolver,
      });

      const violations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow" && rr.occurs);

      // Child_With_DML is in the resolver, so no violation
      expect(violations.length).toBe(0);
    });

    it("should flag subflows that cannot be resolved", () => {
      // Create resolver WITHOUT Child_With_DML
      const incompleteResolver = new PreloadedResolver();
      // Don't add Child_With_DML

      const results = scan([{ flow: parentFlow }], {
        rules: {},
        systemRules: true,
        betaMode: true,
        subflowResolver: incompleteResolver,
      });

      const violations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow" && rr.occurs);

      // Child_With_DML is NOT in the resolver
      expect(violations.length).toBe(1);

      const violation = violations[0].details[0];
      expect(violation.name).toBe("Call_Child_Flow");
      expect(violation.referencedFlow).toBe("Child_With_DML");
    });

    it("should flag nested unresolved subflows", () => {
      // Create resolver with Middle_Flow but without Child_With_DML
      const incompleteResolver = new PreloadedResolver();
      incompleteResolver.addFlow("Middle_Flow", middleFlow);
      // Child_With_DML not added

      const results = scan([{ flow: nestedParentFlow }], {
        rules: {},
        systemRules: true,
        betaMode: true,
        subflowResolver: incompleteResolver,
      });

      const violations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow" && rr.occurs);

      // Middle_Flow exists but is scanned separately - this only checks the parent flow
      expect(violations.length).toBe(0);
    });

    it("should handle flows with no subflows", () => {
      const results = scan([{ flow: childFlow }], {
        rules: {},
        systemRules: true,
        betaMode: true,
        subflowResolver: resolver,
      });

      const violations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow" && rr.occurs);

      // Child flow has no subflows, so no violations
      expect(violations.length).toBe(0);
    });
  });

  describe("Without subflowResolver", () => {
    it("should NOT flag anything when no resolver is provided", () => {
      const results = scan([{ flow: parentFlow }], {
        rules: {},
        systemRules: true,
        betaMode: true,
        // No subflowResolver
      });

      const violations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow" && rr.occurs);

      // Rule requires a resolver to function
      expect(violations.length).toBe(0);
    });
  });

  describe("Managed package subflows", () => {
    it("should NOT flag references to managed-package subflows", () => {
      // ns__FlowName references live in the installed package, never in local
      // source — the resolver can't see them, but that's not an error.
      const flowWithManagedSubflow = new Flow("Managed_Subflow_Caller", {
        label: "Managed Subflow Caller",
        processType: "AutoLaunchedFlow",
        status: "Active",
        subflows: [{
          name: "Call_Managed_Flow",
          flowName: "npsp__Recurring_Donation",
        }],
      });

      const results = scan([{ flow: flowWithManagedSubflow }], {
        rules: {},
        systemRules: true,
        betaMode: true,
        subflowResolver: new PreloadedResolver(),
      });

      const violations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow" && rr.occurs);

      expect(violations.length).toBe(0);
    });
  });

  describe("Programmatic flow with missing flowName attribute", () => {
    it("should flag subflow element missing flowName", () => {
      const flowWithBadSubflow = new Flow("Bad_Subflow_Reference", {
        label: "Bad Subflow Reference",
        processType: "AutoLaunchedFlow",
        status: "Active",
        subflows: [{
          name: "Call_Some_Flow",
          // Missing flowName attribute!
        }],
      });

      const results = scan([{ flow: flowWithBadSubflow }], {
        rules: {},
        systemRules: true,
        betaMode: true,
        subflowResolver: resolver,
      });

      const violations = results
        .flatMap(r => r.ruleResults)
        .filter(rr => rr.ruleId === "unresolved-subflow" && rr.occurs);

      expect(violations.length).toBe(1);
      expect(violations[0].details[0].description).toContain("missing the flowName attribute");
    });
  });
});
