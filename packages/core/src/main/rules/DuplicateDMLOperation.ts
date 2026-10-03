import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class DuplicateDMLOperation extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      ruleId: "duplicate-dml",
      category: "problem",
      name: "DuplicateDMLOperation",
      label: "Duplicate DML Operation",
      description: "When a Flow performs database operations across multiple screens, users navigating backward can cause the same actions to run multiple times. To prevent unintended changes, either restrict backward navigation or redesign the Flow so database operations execute in a single, forward-moving step.",
      summary: "DML across screens may execute multiple times",
      supportedTypes: core.FlowType.visualTypes,
      docRefs: [],
    });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    suppressions: Set<string>
  ): core.Violation[] {
    const graph = flow.graph;
    const start = flow.startReference;

    if (!start) return [];

    const violations: core.Violation[] = [];
    const visited = new Set<string>();

    type State = { name: string; seenDML: boolean };

    const stack: State[] = [{ name: start, seenDML: false }];

    while (stack.length > 0) {
      const { name, seenDML } = stack.pop()!;
      const stateKey = `${name}:${seenDML}`;

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const node = graph.getNode(name);
      if (!node) continue;

      let nextSeenDML = seenDML || this.isDML(node);

      if (
        nextSeenDML &&
        node.subtype === "screens" &&
        this.isTrue(node.element["allowBack"]) &&
        this.isTrue(node.element["showFooter"]) &&
        !suppressions.has(node.name)
      ) {
        violations.push(new core.Violation(node));
        // Note: do NOT return early; multiple violations possible
      }

      // Reset DML flag after screen with back disabled
      if (
        nextSeenDML &&
        node.subtype === "screens" &&
        !this.isTrue(node.element["allowBack"])
      ) {
        nextSeenDML = false;
      }

      for (const next of graph.getNextElements(name)) {
        stack.push({ name: next, seenDML: nextSeenDML });
      }
    }

    return violations;
  }

  private isDML(node: core.FlowNode): boolean {
    return (
      node.subtype === "recordCreates" ||
      node.subtype === "recordUpdates" ||
      node.subtype === "recordDeletes"
    );
  }

  // XML-parsed flows carry the string "true"; flows built from Tooling API
  // JSON (e.g. the Salesforce app) carry a real boolean.
  private isTrue(value: unknown): boolean {
    return value === true || String(value).toLowerCase() === "true";
  }
}
