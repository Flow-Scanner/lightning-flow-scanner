import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { Compiler, Flow, FlowNode, Violation } from "../internals/internals";
import { RuleCommon } from "./RuleCommon";
import { RuleInfo } from "./RuleInfo";

export abstract class LoopRuleCommon extends RuleCommon implements IRuleDefinition {
  constructor(info: RuleInfo, optional?: { severity?: string }) {
    super(info, optional);
  }

  protected check(
    flow: Flow,
    _options: object | undefined,
    suppressions: Set<string>
  ): Violation[] {
    const loopElements = this.findLoopElements(flow);
    if (!loopElements.length) {
      return [];
    }
    const statementsInLoops = this.findStatementsInLoops(flow, loopElements);
    const results = statementsInLoops
      .filter(det => !suppressions.has(det.name))
      .map(det => new Violation(det));
    return results;
  }

  protected abstract getStatementTypes(): string[];

  private findLoopElements(flow: Flow): FlowNode[] {
    return (flow.elements?.filter((node) => node.subtype === "loops") as FlowNode[]) || [];
  }

  private findLoopEnd(element: FlowNode): string {
    return element.element["noMoreValuesConnector"]?.targetReference ?? element.name;
  }

  private findStatementsInLoops(flow: Flow, loopElements: FlowNode[]): FlowNode[] {
    const statementsInLoops: FlowNode[] = [];
    const statementTypes = this.getStatementTypes();
    const findStatement = (element: FlowNode) => {
      if (statementTypes.includes(element.subtype)) {
        statementsInLoops.push(element);
      }
    };
    for (const element of loopElements) {
      const loopEnd = this.findLoopEnd(element);
      new Compiler().traverseFlow(flow, element.name, findStatement, loopEnd);
    }
    return statementsInLoops;
  }
}