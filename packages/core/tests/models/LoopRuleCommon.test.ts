import { describe, expect, it } from "@jest/globals";

import { Flow, FlowNode } from "../../src/main/internals/internals";
import { LoopRuleCommon } from "../../src/main/models/LoopRuleCommon";

class TestLoopRule extends LoopRuleCommon {
  constructor() {
    super({
      description: "Test Rule Description",
      docRefs: [],
      label: "Test Rule",
      name: "TestRule",
      supportedTypes: [],
    });
  }

  protected getStatementTypes(): string[] {
    return ["actionCalls"];
  }
}

describe("LoopRuleCommon", () => {
  let rule: TestLoopRule;

  beforeEach(() => {
    rule = new TestLoopRule();
  });

  describe("execute", () => {
    it("should return empty when no loop elements exists", () => {
      const actionCalls: FlowNode[] = [
        new FlowNode("create_case_manually", "actionCalls", {
          connector: { targetReference: "create_case_manually_2" },
          description: "create case manually",
          label: "create case manually",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually",
        }),
        new FlowNode("create_case_manually_2", "actionCalls", {
          description: "create case manually 2",
          label: "create case manually 2",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually_2",
        }),
      ];
      const flow: Flow = {
        elements: [...actionCalls],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);

      expect(result.occurs).toBe(false);
    });

    it("should return empty when no statements in loops exists", () => {
      const flow: Flow = {
        elements: [
          new FlowNode("loop1", "loops", {
            description: "loop 1",
            label: "loop",
            locationX: "0",
            locationY: "0",
            name: "loop1",
            nextValueConnector: { targetReference: "assign1" },
            noMoreValuesConnector: { targetReference: "End" },
          }),
          new FlowNode("assign1", "assignments", {
            connector: { targetReference: "End" },
            name: "assign1",
          }),
        ],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);

      expect(result.occurs).toBe(false);
    });

    it("should return when loop elements with statements exists", () => {
      const actionCalls: FlowNode[] = [
        new FlowNode("create_case_manually", "actionCalls", {
          connector: { targetReference: "create_case_manually_2" },
          description: "create case manually",
          label: "create case manually",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually",
        }),
        new FlowNode("create_case_manually_2", "actionCalls", {
          description: "create case manually 2",
          label: "create case manually 2",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually_2",
        }),
      ];

      const loopElements: FlowNode[] = [
        new FlowNode("loop1", "loops", {
          description: "loop 1",
          label: "loop",
          locationX: "0",
          locationY: "0",
          name: "loop1",
          nextValueConnector: { targetReference: "create_case_manually" },
          noMoreValuesConnector: { targetReference: "End" },
        }),
      ];

      const flow: Flow = {
        elements: [...loopElements, ...actionCalls],
      } as Partial<Flow> as Flow;

      const result = rule.execute(flow);

      expect(result.occurs).toBe(true);
    });
  });

  describe("findLoopElements", () => {
    it("should return empty when all elements are not loops", () => {
      const actionCalls: FlowNode[] = [
        new FlowNode("create_case_manually", "actionCalls", {
          connector: { targetReference: "create_case_manually_2" },
          description: "create case manually",
          label: "create case manually",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually",
        }),
        new FlowNode("create_case_manually_2", "actionCalls", {
          description: "create case manually 2",
          label: "create case manually 2",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually_2",
        }),
      ];
      const flow: Flow = {
        elements: [...actionCalls],
      } as Partial<Flow> as Flow;

      const result = rule["findLoopElements"](flow);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
    it("should return empty when no loop elements exists", () => {
      const flow: Flow = {
        elements: [],
      } as Partial<Flow> as Flow;

      const result = rule["findLoopElements"](flow);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe("findLoopEnd", () => {
    it("should return current element when noMoreValuesConnector is not defined", () => {
      const element = new FlowNode("loop1", "loops", {
        name: "loop1",
      });

      const result = rule["findLoopEnd"](element);

      expect(result).toBe("loop1");
    });
    it("should return the targetReference of noMoreValuesConnector", () => {
      const element = new FlowNode("loop1", "loops", {
        noMoreValuesConnector: { targetReference: "End" },
      });

      const result = rule["findLoopEnd"](element);

      expect(result).toBe("End");
    });
  });

  describe("findStatementsInLoops", () => {
    it("should return empty when no statements in loops exists", () => {
      const actionCalls: FlowNode[] = [
        new FlowNode("create_case_manually", "actionCalls", {
          connector: { targetReference: "create_case_manually_2" },
          description: "create case manually",
          label: "create case manually",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually",
        }),
        new FlowNode("create_case_manually_2", "actionCalls", {
          description: "create case manually 2",
          label: "create case manually 2",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually_2",
        }),
      ];

      const flow: Flow = {
        elements: [...actionCalls],
      } as Partial<Flow> as Flow;

      const result = rule["findStatementsInLoops"](flow, []);

      expect(result).toHaveLength(0);
    });

    it("should find statements in loop", () => {
      const actionCalls: FlowNode[] = [
        new FlowNode("create_case_manually", "actionCalls", {
          connector: { targetReference: "create_case_manually_2" },
          description: "create case manually",
          label: "create case manually",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually",
        }),
        new FlowNode("create_case_manually_2", "actionCalls", {
          description: "create case manually 2",
          label: "create case manually 2",
          locationX: "0",
          locationY: "0",
          name: "create_case_manually_2",
        }),
      ];

      const loopElements: FlowNode[] = [
        new FlowNode("loop1", "loops", {
          description: "loop 1",
          label: "loop",
          locationX: "0",
          locationY: "0",
          name: "loop1",
          nextValueConnector: { targetReference: "create_case_manually" },
          noMoreValuesConnector: { targetReference: "End" },
        }),
      ];

      const flow: Flow = {
        elements: [...loopElements, ...actionCalls],
      } as Partial<Flow> as Flow;

      const result = rule["findStatementsInLoops"](flow, loopElements);

      expect(result).toHaveLength(2);
      expect(result).toEqual(actionCalls);
    });
  });
});
