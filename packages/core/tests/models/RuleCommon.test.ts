import { describe, expect, it } from "@jest/globals";
import { RuleCommon } from "../../src/main/models/RuleCommon";
import { DefaultRuleStore } from "../../src/main/store/DefaultRuleStore";

type RuleConstructor = new () => RuleCommon;
interface RuleStore {
  [ruleName: string]: RuleConstructor;
}

const rules = DefaultRuleStore as unknown as RuleStore;

describe("RuleCommon automatically sets isConfigurable correctly", () => {
  it("isConfigurable=true only when check() actually uses options. or options?", () => {
    for (const [ruleKey, RuleClass] of Object.entries(rules)) {
      if (typeof RuleClass !== "function") continue;

      const ruleInstance = new RuleClass();
      const checkSource = RuleClass.prototype.check.toString();
      const usesOptions = /options[.\?]/.test(checkSource);

      expect(ruleInstance.isConfigurable).toBe(usesOptions);

      if (ruleInstance.isConfigurable !== usesOptions) {
        console.log(`\nMISMATCH on rule: ${ruleInstance.name}`);
        console.log(`   isConfigurable = ${ruleInstance.isConfigurable}`);
        console.log(`   source ${usesOptions ? "DOES" : "does NOT"} use options`);
        console.log(`   check() source:\n${checkSource}\n`);
      }
    }
  });

  it("known configurable rules have isConfigurable=true", () => {
    const cyclomatic = new (rules.CyclomaticComplexity as RuleConstructor)();
    const flowName = new (rules.FlowName as RuleConstructor)();

    expect(cyclomatic.isConfigurable).toBe(true);
    expect(flowName.isConfigurable).toBe(true);
  });

  it("known non-configurable rules have isConfigurable=false", () => {
    const duplicateDml = new (rules.DuplicateDMLOperation as RuleConstructor)();
    const autoLayout = new (rules.AutoLayout as RuleConstructor)();

    expect(duplicateDml.isConfigurable).toBe(false);
    expect(autoLayout.isConfigurable).toBe(false);
  });
});