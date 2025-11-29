import { IRuleDefinition } from "../interfaces/IRuleDefinition";
import { BetaRuleStore, DefaultRuleStore } from "../store/DefaultRuleStore";

export class DynamicRule<T extends IRuleDefinition> {
  constructor(className: string, betaMode = false) {
    if (betaMode && BetaRuleStore.hasOwnProperty(className)) {
      return new BetaRuleStore[className]() as T;
    }
    return new DefaultRuleStore[className]() as T;
  }
}
