import * as path from "path";
import { parse, Flow } from "../src/index";
import { FlowDataFlow } from "../src/main/models/FlowDataFlow";
import {
  baseVariable,
  extractMergeFields,
  isGlobalReference,
} from "../src/main/libs/ReferenceExtractor";

const testFlowsDir = path.resolve(__dirname, "../../../example-flows/force-app/testing");

async function load(file: string): Promise<Flow> {
  const parsed = await parse([path.join(testFlowsDir, file)]);
  return parsed[0].flow!;
}

describe("ReferenceExtractor", () => {
  it("reduces a reference to its base variable", () => {
    expect(baseVariable("Loop_Through_Accounts.AnnualRevenue")).toBe("Loop_Through_Accounts");
    expect(baseVariable("MyVar")).toBe("MyVar");
    expect(baseVariable("$Record.OwnerId")).toBe("$Record");
  });

  it("identifies global references", () => {
    expect(isGlobalReference("$Record")).toBe(true);
    expect(isGlobalReference("MyVar")).toBe(false);
  });

  it("extracts merge fields from text", () => {
    expect(extractMergeFields('"https://x/"&{!$User.Id}&{!AccountId}')).toEqual([
      "$User.Id",
      "AccountId",
    ]);
    expect(extractMergeFields("no references here")).toEqual([]);
    expect(extractMergeFields(undefined)).toEqual([]);
  });
});

describe("FlowDataFlow - Loop_Assignment_Pattern", () => {
  let df: FlowDataFlow;

  beforeAll(async () => {
    df = new FlowDataFlow(await load("Loop_Assignment_Pattern.flow-meta.xml"));
  });

  it("loop reads its collection and defines a current-item variable named after itself", () => {
    expect(df.reads("Loop_Through_Accounts").has("AccountCollection")).toBe(true);
    expect(df.writes("Loop_Through_Accounts").has("Loop_Through_Accounts")).toBe(true);
  });

  it("Assign writes the loop item's base variable and reads nothing (literal RHS)", () => {
    // Assign_Account_Fields sets Loop_Through_Accounts.AnnualRevenue / .Rating to literals
    expect(df.writes("Assign_Account_Fields").has("Loop_Through_Accounts")).toBe(true);
    expect(df.reads("Assign_Account_Fields").size).toBe(0);
  });

  it("Add operator reads and writes the target, and reads the added reference", () => {
    // Add_To_Collection: UpdatedAccounts Add Loop_Through_Accounts
    const reads = df.reads("Add_To_Collection");
    const writes = df.writes("Add_To_Collection");
    expect(writes.has("UpdatedAccounts")).toBe(true);
    expect(reads.has("UpdatedAccounts")).toBe(true); // compound operator reads target
    expect(reads.has("Loop_Through_Accounts")).toBe(true);
  });

  it("recordCreates reads its inputReference", () => {
    expect(df.reads("Create_Updated_Accounts").has("UpdatedAccounts")).toBe(true);
  });
});
