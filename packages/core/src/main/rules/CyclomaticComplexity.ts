import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class CyclomaticComplexity extends RuleCommon implements IRuleDefinition {
  private defaultThreshold: number = 25;
  private cyclomaticComplexityUnit: number = 0;

  constructor() {
    super(
      {
        name: "CyclomaticComplexity",
        label: "Cyclomatic Complexity",
        description: `The number of loops and decision rules, plus the number of decisions. Use a combination of 1) subflows and 2) breaking flows into multiple concise trigger ordered flows, to reduce the cyclomatic complexity within a single flow, ensuring maintainability and simplicity.`,
        supportedTypes: core.FlowType.backEndTypes,
        docRefs: [
          {
            label: `Cyclomatic complexity is a software metric used to indicate the complexity of a program. It is a quantitative measure of the number of linearly independent paths through a program's source code.`,
            path: "https://en.wikipedia.org/wiki/Cyclomatic_complexity",
          },
        ],
      },
      { severity: "note" }
    );
  }

  protected check(
  flow: core.Flow,
  options: { threshold?: number } | undefined
): core.Violation[] {
  const threshold = options?.threshold || this.defaultThreshold;
  let cyclomaticComplexity = 1;

  const flowDecisions = flow?.elements?.filter(
    (node) => node.subtype === "decisions"
  ) as core.FlowElement[];

  const flowLoops = flow?.elements?.filter(
    (node) => node.subtype === "loops"
  );

  for (const decision of flowDecisions || []) {
    const rules = decision.element["rules"];
    cyclomaticComplexity += Array.isArray(rules)
      ? rules.length + 1
      : 1;
  }

  cyclomaticComplexity += flowLoops?.length ?? 0;
  this.cyclomaticComplexityUnit = cyclomaticComplexity;

  if (cyclomaticComplexity > threshold) {
    return [
      new core.Violation(
        new core.FlowAttribute(
          `${cyclomaticComplexity}`,
          "CyclomaticComplexity",
          `>${threshold}`
        )
      )
    ];
  }

  return [];
}

}