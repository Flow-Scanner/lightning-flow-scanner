import { buildResolver, parseFlowXml, Flow, FlowSource } from "../src/index";

/** Minimal Flow XML that calls the given subflows. */
function flowXml(subflowNames: string[]): string {
  const subflows = subflowNames
    .map(
      (name) =>
        `<subflows><name>Call_${name}</name><flowName>${name}</flowName></subflows>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>58.0</apiVersion>
  <processType>AutoLaunchedFlow</processType>
  <status>Active</status>
  ${subflows}
</Flow>`;
}

/** Build an in-memory source over a name -> subflow-names graph. */
function memorySource(graph: Record<string, string[]>): {
  source: FlowSource;
  calls: string[];
} {
  const calls: string[] = [];
  const source: FlowSource = async (name) => {
    calls.push(name);
    if (!(name in graph)) return undefined;
    return parseFlowXml(name, flowXml(graph[name]));
  };
  return { source, calls };
}

function root(name: string, subflows: string[]): Flow {
  return parseFlowXml(name, flowXml(subflows));
}

describe("buildResolver", () => {
  it("parses flow XML from a string (browser-safe path)", () => {
    const flow = parseFlowXml("Parent", flowXml(["Child"]));
    expect(flow.getSubflowNames()).toEqual(["Child"]);
  });

  it("resolves the transitive subflow closure", async () => {
    const { source } = memorySource({
      A: ["B"],
      B: ["C"],
      C: [],
    });
    const resolver = await buildResolver([root("A", ["B"])], source);

    expect(resolver.has("A")).toBe(true);
    expect(resolver.has("B")).toBe(true);
    expect(resolver.has("C")).toBe(true);
    expect(resolver.getSync("C")).toBeDefined();
  });

  it("fetches each flow at most once, even with cycles", async () => {
    const { source, calls } = memorySource({
      A: ["B"],
      B: ["A", "C"], // cycle back to A
      C: ["B"], // cycle back to B
    });
    const resolver = await buildResolver([root("A", ["B"])], source);

    expect(resolver.has("C")).toBe(true);
    // A is a root (never fetched); B and C each fetched exactly once.
    expect(calls.filter((c) => c === "B")).toHaveLength(1);
    expect(calls.filter((c) => c === "C")).toHaveLength(1);
    expect(calls).not.toContain("A");
  });

  it("skips managed-package subflows by default", async () => {
    const { source, calls } = memorySource({ "ns__Managed": [] });
    const resolver = await buildResolver([root("Root", ["ns__Managed"])], source);

    expect(resolver.has("ns__Managed")).toBe(false);
    expect(calls).not.toContain("ns__Managed");
  });

  it("honors maxDepth", async () => {
    const { source } = memorySource({ A: ["B"], B: ["C"], C: [] });
    const resolver = await buildResolver([root("A", ["B"])], source, {
      maxDepth: 1,
    });

    expect(resolver.has("B")).toBe(true); // 1 hop
    expect(resolver.has("C")).toBe(false); // 2 hops, beyond cap
  });

  it("skips flows the source cannot find without throwing", async () => {
    const { source } = memorySource({ A: ["Missing"] });
    const resolver = await buildResolver([root("A", ["Missing"])], source);
    expect(resolver.has("Missing")).toBe(false);
    expect(resolver.has("A")).toBe(true);
  });
});
