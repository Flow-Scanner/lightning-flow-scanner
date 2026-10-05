import {
  NoOpResolver,
  PreloadedResolver,
  defaultResolver,
  Flow,
} from "../src/index";

describe("SubflowResolver", () => {
  describe("NoOpResolver", () => {
    const resolver = new NoOpResolver();

    it("should return undefined for any flow name", async () => {
      const result = await resolver.resolve("SomeFlow");
      expect(result.flowName).toBe("SomeFlow");
      expect(result.flow).toBeUndefined();
    });

    it("should resolve many flows as undefined", async () => {
      const results = await resolver.resolveMany(["Flow1", "Flow2", "Flow3"]);
      expect(results.size).toBe(3);
      expect(results.get("Flow1")?.flow).toBeUndefined();
      expect(results.get("Flow2")?.flow).toBeUndefined();
      expect(results.get("Flow3")?.flow).toBeUndefined();
    });

    it("should always return false for has()", () => {
      expect(resolver.has("AnyFlow")).toBe(false);
    });

    it("should return undefined for getSync()", () => {
      expect(resolver.getSync("AnyFlow")).toBeUndefined();
    });
  });

  describe("PreloadedResolver", () => {
    it("should resolve pre-loaded flows", async () => {
      const mockFlow = new Flow("TestFlow", {
        label: "Test Flow",
        processType: "AutoLaunchedFlow",
        status: "Active",
      });

      const resolver = new PreloadedResolver();
      resolver.addFlow("TestFlow", mockFlow);

      const result = await resolver.resolve("TestFlow");
      expect(result.flowName).toBe("TestFlow");
      expect(result.flow).toBe(mockFlow);
      expect(result.isManaged).toBeUndefined();
    });

    it("should return undefined for non-existent flows", async () => {
      const resolver = new PreloadedResolver();
      const result = await resolver.resolve("NonExistent");
      expect(result.flow).toBeUndefined();
    });

    it("should track managed flows", async () => {
      const mockFlow = new Flow("ns__ManagedFlow", {
        label: "Managed Flow",
        processType: "AutoLaunchedFlow",
        status: "Active",
      });

      const resolver = new PreloadedResolver();
      resolver.addFlow("ns__ManagedFlow", mockFlow, { isManaged: true });

      const result = await resolver.resolve("ns__ManagedFlow");
      expect(result.isManaged).toBe(true);
    });

    it("should initialize with flows from constructor", async () => {
      const flow1 = new Flow("Flow1", { label: "Flow 1" });
      const flow2 = new Flow("Flow2", { label: "Flow 2" });

      const initialFlows = new Map<string, Flow>([
        ["Flow1", flow1],
        ["Flow2", flow2],
      ]);

      const resolver = new PreloadedResolver(initialFlows);
      expect(resolver.size).toBe(2);
      expect(resolver.has("Flow1")).toBe(true);
      expect(resolver.has("Flow2")).toBe(true);
    });

    it("should add flows from XML data", async () => {
      const resolver = new PreloadedResolver();
      resolver.addFlowFromXml("XmlFlow", {
        label: "XML Flow",
        processType: "AutoLaunchedFlow",
        status: "Active",
      });

      const result = await resolver.resolve("XmlFlow");
      expect(result.flow).toBeDefined();
      expect(result.flow?.label).toBe("XML Flow");
    });

    it("should support batch adding flows", async () => {
      const resolver = new PreloadedResolver();
      const flows = new Map<string, Flow>([
        ["A", new Flow("A", { label: "A" })],
        ["B", new Flow("B", { label: "B" })],
      ]);

      resolver.addFlows(flows);
      expect(resolver.size).toBe(2);
    });

    it("should resolve many flows", async () => {
      const resolver = new PreloadedResolver();
      resolver.addFlow("Flow1", new Flow("Flow1", { label: "Flow 1" }));
      resolver.addFlow("Flow2", new Flow("Flow2", { label: "Flow 2" }));

      const results = await resolver.resolveMany(["Flow1", "Flow2", "Flow3"]);
      expect(results.get("Flow1")?.flow).toBeDefined();
      expect(results.get("Flow2")?.flow).toBeDefined();
      expect(results.get("Flow3")?.flow).toBeUndefined();
    });

    it("should clear all flows", () => {
      const resolver = new PreloadedResolver();
      resolver.addFlow("Flow1", new Flow("Flow1", { label: "Flow 1" }));
      expect(resolver.size).toBe(1);

      resolver.clear();
      expect(resolver.size).toBe(0);
    });

    it("should remove individual flows", () => {
      const resolver = new PreloadedResolver();
      resolver.addFlow("Flow1", new Flow("Flow1", { label: "Flow 1" }));
      resolver.addFlow("Flow2", new Flow("Flow2", { label: "Flow 2" }));

      expect(resolver.removeFlow("Flow1")).toBe(true);
      expect(resolver.size).toBe(1);
      expect(resolver.has("Flow1")).toBe(false);
      expect(resolver.has("Flow2")).toBe(true);
    });

    it("should list flow names", () => {
      const resolver = new PreloadedResolver();
      resolver.addFlow("Alpha", new Flow("Alpha", {}));
      resolver.addFlow("Beta", new Flow("Beta", {}));

      const names = resolver.getFlowNames();
      expect(names).toContain("Alpha");
      expect(names).toContain("Beta");
    });

    it("should return flow synchronously via getSync()", () => {
      const flow = new Flow("SyncFlow", { label: "Sync Flow" });
      const resolver = new PreloadedResolver();
      resolver.addFlow("SyncFlow", flow);

      const syncResult = resolver.getSync("SyncFlow");
      expect(syncResult).toBe(flow);
    });

    it("should return undefined from getSync() for non-existent flow", () => {
      const resolver = new PreloadedResolver();
      expect(resolver.getSync("NonExistent")).toBeUndefined();
    });
  });

  describe("defaultResolver", () => {
    it("should be a NoOpResolver", () => {
      expect(defaultResolver).toBeInstanceOf(NoOpResolver);
    });
  });
});

describe("Flow subflow helpers", () => {
  const flowWithSubflows = new Flow("ParentFlow", {
    label: "Parent Flow",
    processType: "AutoLaunchedFlow",
    status: "Active",
    subflows: [
      { name: "CallSubflow1", flowName: "ChildFlow1" },
      { name: "CallSubflow2", flowName: "ChildFlow2" },
      { name: "CallSubflow3", flowName: "ChildFlow1" }, // duplicate reference
    ],
  });

  const flowWithoutSubflows = new Flow("SimpleFlow", {
    label: "Simple Flow",
    processType: "AutoLaunchedFlow",
    status: "Active",
    assignments: [{ name: "SetVar", assignmentItems: [] }],
  });

  describe("getSubflowNodes()", () => {
    it("should return subflow nodes", () => {
      const subflowNodes = flowWithSubflows.getSubflowNodes();
      expect(subflowNodes.length).toBe(3);
      expect(subflowNodes[0].flowName).toBe("ChildFlow1");
      expect(subflowNodes[1].flowName).toBe("ChildFlow2");
    });

    it("should return empty array when no subflows", () => {
      const subflowNodes = flowWithoutSubflows.getSubflowNodes();
      expect(subflowNodes.length).toBe(0);
    });
  });

  describe("getSubflowNames()", () => {
    it("should return unique subflow names", () => {
      const names = flowWithSubflows.getSubflowNames();
      expect(names.length).toBe(2); // deduplicated
      expect(names).toContain("ChildFlow1");
      expect(names).toContain("ChildFlow2");
    });

    it("should return empty array when no subflows", () => {
      const names = flowWithoutSubflows.getSubflowNames();
      expect(names.length).toBe(0);
    });
  });

  describe("hasSubflows()", () => {
    it("should return true when flow has subflows", () => {
      expect(flowWithSubflows.hasSubflows()).toBe(true);
    });

    it("should return false when flow has no subflows", () => {
      expect(flowWithoutSubflows.hasSubflows()).toBe(false);
    });
  });
});
