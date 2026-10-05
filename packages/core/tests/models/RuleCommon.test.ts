import { describe, expect, it } from "@jest/globals";
import { ruleRegistry } from "../../src/main/config/RuleRegistry";
import { getRules } from "../../src/main/libs/GetRuleDefinitions";

describe("RuleCommon automatically sets isConfigurable correctly", () => {
  it("isConfigurable=true only when check() actually uses options", () => {
    // Get all rule classes (including beta, since the test should cover everything)
    const allRuleIds = ruleRegistry.getAllRuleIds(true);

    for (const ruleId of allRuleIds) {
      const ruleInstance = ruleRegistry.createInstance(ruleId);

      const checkSource = (ruleInstance as any).check.toString();
      // `subflowResolver` is injected into the options bag by the scan framework
      // (see ScanFlows), not a user-facing configurable option, so reading it must
      // not count as consuming rule configuration.
      const configSource = checkSource.replace(/options\s*\??\s*\.\s*subflowResolver/g, "");
      const usesOptions = /options[.\?]/.test(configSource);

      expect(ruleInstance.isConfigurable).toBe(usesOptions);

      if (ruleInstance.isConfigurable !== usesOptions) {
        console.log(`\nMISMATCH on rule: ${ruleInstance.name} (${ruleId})`);
        console.log(`   isConfigurable = ${ruleInstance.isConfigurable}`);
        console.log(`   source ${usesOptions ? "DOES" : "does NOT"} use options`);
        console.log(`   check() source:\n${checkSource}\n`);
      }
    }
  });

  it("known configurable rules have isConfigurable=true", () => {
    const cyclomatic = ruleRegistry.createInstance("excessive-cyclomatic-complexity");
    const flowName = ruleRegistry.createInstance("invalid-naming-convention");

    expect(cyclomatic.isConfigurable).toBe(true);
    expect(flowName.isConfigurable).toBe(true);
  });

  it("known non-configurable rules have isConfigurable=false", () => {
    const duplicateDml = ruleRegistry.createInstance("duplicate-dml");
    const autoLayout = ruleRegistry.createInstance("missing-auto-layout");

    expect(duplicateDml.isConfigurable).toBe(false);
    expect(autoLayout.isConfigurable).toBe(false);
  });
});

describe("configurableOptions metadata is accessible on rule instances", () => {
  it("getRules() returns configurable rules with configurableOptions array", () => {
    const rules = getRules(undefined, { betaMode: true });
    const configurableRules = rules.filter((r) => r.isConfigurable);

    expect(configurableRules.length).toBeGreaterThan(0);

    for (const rule of configurableRules) {
      expect(rule.configurableOptions).toBeDefined();
      expect(Array.isArray(rule.configurableOptions)).toBe(true);
      expect((rule.configurableOptions ?? []).length).toBeGreaterThan(0);
    }
  });

  it("each ConfigurableOption has the required fields (name, type, description)", () => {
    const rules = getRules(undefined, { betaMode: true });
    const configurableRules = rules.filter((r) => r.isConfigurable);

    for (const rule of configurableRules) {
      for (const opt of rule.configurableOptions ?? []) {
        expect(typeof opt.name).toBe("string");
        expect(["number", "string", "boolean", "expression"]).toContain(opt.type);
        expect(typeof opt.description).toBe("string");
      }
    }
  });

  it("known configurable rules expose expected configurableOptions", () => {
    const apiVersion = ruleRegistry.createInstance("invalid-api-version");
    expect(apiVersion.configurableOptions).toEqual([
      {
        name: "expression",
        type: "expression",
        description: expect.any(String),
        defaultValue: ">= 50",
      },
    ]);

    const cyclomatic = ruleRegistry.createInstance("excessive-cyclomatic-complexity");
    expect(cyclomatic.configurableOptions).toEqual([
      {
        name: "threshold",
        type: "number",
        description: expect.any(String),
        defaultValue: 25,
      },
    ]);

    const flowName = ruleRegistry.createInstance("invalid-naming-convention");
    expect(flowName.configurableOptions).toEqual([
      {
        name: "expression",
        type: "expression",
        description: expect.any(String),
        defaultValue: "[A-Za-z0-9]+_[A-Za-z0-9]+",
      },
    ]);
  });

  it("non-configurable rules have configurableOptions as undefined", () => {
    const duplicateDml = ruleRegistry.createInstance("duplicate-dml");
    expect(duplicateDml.configurableOptions).toBeUndefined();
  });
});