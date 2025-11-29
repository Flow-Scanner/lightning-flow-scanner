# How to Write a Rule

## What You Need to Know Upfront

Your rule only has to implement one method: **check()**.  
Everything else (suppression handling, wildcard “\*”, conversion to RuleResult) is done for you by RuleCommon.execute().

- You return every violation you find – no manual “if (!suppressions.has(name))” needed in 95% of cases.
- The base class automatically removes violations whose element.name (or the attr name for flow-level issues) is listed in the suppressions array.
- You can add manual suppression checks for performance improvements, when the traversal is expensive (e.g. graph walking in MissingFaultPath, UnconnectedElement, DuplicateDMLOperation).

## The Flow Model – What You Actually Work With

The Flow object gives you three main collections (already parsed and typed):

- flow.elements → every node, variable, constant, formula, choice, etc.  
  Each item is a FlowNode, FlowVariable, FlowMetadata or FlowResource and always has a .name property.
- flow.xmldata → raw JSON version of the Flow XML (useful for processMetadataValues, description, apiVersion, CanvasMode, etc.).
- flow.start / flow.startElementReference / flow.startReference → entry point of the flow.

Common filters you will use:

- flow.elements?.filter(e => e.subtype === "recordLookups")
- flow.elements?.filter(e => e.subtype === "loops")
- flow.elements?.filter(e => e.subtype === "decisions")

## The Compiler

Compiler.traverseFlow(flow, startName, callback, optionalEndName) walks the flow exactly like the runtime does (iterative DFS, respects fault connectors, loop “noMoreValuesConnector”, etc.).  
Most complex rules (fault paths, unconnected elements, DML-in-loop, etc.) use this helper.

```ts
new Compiler().traverseFlow(
  flow, // your Flow instance
  flow.startReference, // name of the start element (or startElementReference)
  (element: FlowNode) => {
    // callback executed on every reachable element
    // your logic here – element is a FlowNode with .name, .subtype, .element, .connectors
  },
  optionalEndName // (optional) stop traversal when this name is reached (used for loops)
);
```

## Example – Simple Element Rule (without manual suppressions)

```ts
import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class HardcodedReferences extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "HardcodedReferences",
      label: "Hard-coded Record References",
      description:
        "Detects Get Records or other elements that use hard-coded Ids instead of variables.",
      supportedTypes: core.FlowType.allTypes(),
      docRefs: [],
      isConfigurable: false,
      autoFixable: false,
    });
  }

  protected check(
    flow: core.Flow,
    _options: object | undefined,
    _suppressions: Set<string>
  ): core.Violation[] {
    const violations: core.Violation[] = [];

    const lookups = flow.elements?.filter((e) => e.subtype === "recordLookups") ?? [];

    for (const node of lookups) {
      const filterLogic = node.element.filterLogic;
      const conditions = node.element.conditions ?? node.element.objectConditions;

      // naive check – real rule would parse the condition properly
      if (JSON.stringify(conditions).match(/[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18}/)) {
        violations.push(new core.Violation(node));
      }
    }

    return violations; // suppression handled automatically by base class
  }
}
```

## Writing a New Rule – The Recipe

1. Create a file src/main/rules/YourRuleName.ts
2. Extend RuleCommon (or LoopRuleCommon for loop-only rules).
3. In the constructor call super({ …RuleInfo… }) – all metadata goes here.
4. Implement protected check(flow, options, suppressions) → Violation[]
   - Do your analysis.
   - Return new Violation(element) for element-level issues.
   - Return new Violation(new FlowAttribute(value, "property", "expected")) for flow-level issues.
   - No suppression code needed unless performance demands it.
5. Add the rule to DefaultRuleStore.ts
