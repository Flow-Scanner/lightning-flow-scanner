import { describe, expect, it } from "@jest/globals";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as core from "../src";

const ruleConfig = {
  betaMode: true,
  ruleMode: "isolated" as const,
  rules: {
    "duplicate-flow-logic": {
      severity: "warning",
    },
  },
};

describe("DuplicateFlowLogic", () => {
  it("reports a renamed copy in another flow and keeps the longest chain", async () => {
    const dir = writeFlows({
      "Billing_One.flow-meta.xml": chain({
        lookup: "Get_Account",
        decision: "Check_Status",
        update: "Update_Account",
        assignment: "Set_Flag",
        variable: "accountId",
      }),
      "Billing_Two.flow-meta.xml": chain({
        lookup: "Lookup_Acct",
        decision: "Decide_Active",
        update: "Save_Acct",
        assignment: "Mark_Done",
        variable: "acctId",
        locationX: 900,
      }),
      "Unrelated.flow-meta.xml": chain({
        lookup: "Get_Contact",
        decision: "Check_Contact",
        update: "Update_Contact",
        variable: "contactId",
        objectName: "Contact",
        field: "Email",
      }),
    });

    const results = core.scan(
      await core.parse([
        path.join(dir, "Billing_One.flow-meta.xml"),
        path.join(dir, "Billing_Two.flow-meta.xml"),
        path.join(dir, "Unrelated.flow-meta.xml"),
      ]),
      ruleConfig
    );

    const billingOne = violationsFor(results, "Billing_One");
    const billingTwo = violationsFor(results, "Billing_Two");
    const unrelated = violationsFor(results, "Unrelated");

    expect(billingOne).toHaveLength(1);
    expect(billingTwo).toHaveLength(1);
    expect(unrelated).toHaveLength(0);
    expect(billingOne[0].name).toBe("Get_Account");
    expect(billingOne[0].details).toMatchObject({
      expression: expect.stringContaining(
        "Billing_Two (Lookup_Acct > Decide_Active > Save_Acct > Mark_Done)"
      ),
    });
    expect(billingTwo[0].details).toMatchObject({
      expression: expect.stringContaining(
        "Billing_One (Get_Account > Check_Status > Update_Account > Set_Flag)"
      ),
    });

    const flat = core.exportDetails(results, true);
    const row = flat.find(
      (item) => item.flowName === "Billing_One" && item.ruleId === "duplicate-flow-logic"
    );
    expect(row?.message).toContain("Billing_Two");
    expect(row?.expression).toContain("Lookup_Acct");
  });

  it("does not report a chain shorter than three elements", async () => {
    const dir = writeFlows({
      "Short_One.flow-meta.xml": chain({
        lookup: "Get_Account",
        decision: "Check_Status",
        update: "Update_Account",
        variable: "accountId",
        stopAfter: "decision",
      }),
      "Short_Two.flow-meta.xml": chain({
        lookup: "Lookup_Acct",
        decision: "Decide_Active",
        update: "Save_Acct",
        variable: "acctId",
        stopAfter: "decision",
      }),
    });

    const results = core.scan(
      await core.parse([
        path.join(dir, "Short_One.flow-meta.xml"),
        path.join(dir, "Short_Two.flow-meta.xml"),
      ]),
      ruleConfig
    );

    expect(violationsFor(results, "Short_One")).toHaveLength(0);
    expect(violationsFor(results, "Short_Two")).toHaveLength(0);
  });

  it("stays out of a scan that does not enable beta rules", async () => {
    const dir = writeFlows({
      "Billing_One.flow-meta.xml": chain({
        lookup: "Get_Account",
        decision: "Check_Status",
        update: "Update_Account",
        variable: "accountId",
      }),
      "Billing_Two.flow-meta.xml": chain({
        lookup: "Lookup_Acct",
        decision: "Decide_Active",
        update: "Save_Acct",
        variable: "acctId",
      }),
    });

    const results = core.scan(
      await core.parse([
        path.join(dir, "Billing_One.flow-meta.xml"),
        path.join(dir, "Billing_Two.flow-meta.xml"),
      ])
    );

    const ruleNames = results.flatMap((result) => result.ruleResults.map((rule) => rule.ruleId));
    expect(ruleNames).not.toContain("duplicate-flow-logic");
  });

  it("reports the same chain twice inside one flow", async () => {
    const dir = writeFlows({
      "Split_Copy.flow-meta.xml": branchedCopy(),
    });

    const results = core.scan(
      await core.parse([path.join(dir, "Split_Copy.flow-meta.xml")]),
      ruleConfig
    );

    const violations = violationsFor(results, "Split_Copy");
    expect(violations).toHaveLength(2);
    expect(violations.every((violation) => violation.name === "Split")).toBe(true);
    const text = violations
      .map((violation) => (violation.details as { expression?: string }).expression)
      .join("\n");
    expect(text).toContain("Left_Get > Left_Check > Left_Update");
    expect(text).toContain("Right_Get > Right_Check > Right_Update");
  });
});

function violationsFor(results: core.ScanResult[], flowName: string): core.Violation[] {
  const scanResult = results.find((result) => result.flow.name === flowName);
  const ruleResult = scanResult?.ruleResults.find((rule) => rule.ruleId === "duplicate-flow-logic");
  return ruleResult?.details ?? [];
}

interface ChainSpec {
  lookup: string;
  decision: string;
  update: string;
  assignment?: string;
  variable: string;
  objectName?: string;
  field?: string;
  locationX?: number;
  stopAfter?: "decision" | "update";
}

function chain(spec: ChainSpec): string {
  const objectName = spec.objectName ?? "Account";
  const field = spec.field ?? "Active__c";
  const locationX = spec.locationX ?? 176;
  const updateConnector = spec.assignment
    ? `<connector><targetReference>${spec.assignment}</targetReference></connector>`
    : "";
  const decisionTarget = spec.stopAfter === "decision" ? spec.decision : spec.update;
  const assignment = spec.assignment
    ? `
    <assignments>
        <name>${spec.assignment}</name>
        <label>Different label ${spec.assignment}</label>
        <locationX>${locationX}</locationX>
        <locationY>458</locationY>
        <assignmentItems>
            <assignToReference>${spec.variable}</assignToReference>
            <operator>Assign</operator>
            <value>
                <stringValue>done</stringValue>
            </value>
        </assignmentItems>
    </assignments>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>64.0</apiVersion>
    ${assignment}
    <decisions>
        <name>${spec.decision}</name>
        <label>Different label ${spec.decision}</label>
        <locationX>${locationX}</locationX>
        <locationY>242</locationY>
        <defaultConnector>
            <targetReference>${decisionTarget}</targetReference>
        </defaultConnector>
        <defaultConnectorLabel>Default Outcome</defaultConnectorLabel>
        <rules>
            <name>Is_Match</name>
            <conditionLogic>and</conditionLogic>
            <conditions>
                <leftValueReference>${spec.lookup}.${field}</leftValueReference>
                <operator>EqualTo</operator>
                <rightValue>
                    <booleanValue>true</booleanValue>
                </rightValue>
            </conditions>
            <connector>
                <targetReference>${decisionTarget}</targetReference>
            </connector>
            <label>Is Match</label>
        </rules>
    </decisions>
    <interviewLabel>Copy {!$Flow.CurrentDateTime}</interviewLabel>
    <label>Copied logic</label>
    <processType>AutoLaunchedFlow</processType>
    <recordLookups>
        <name>${spec.lookup}</name>
        <label>Different label ${spec.lookup}</label>
        <locationX>${locationX}</locationX>
        <locationY>134</locationY>
        <assignNullValuesIfNoRecordsFound>false</assignNullValuesIfNoRecordsFound>
        <connector>
            <targetReference>${spec.decision}</targetReference>
        </connector>
        <filterLogic>and</filterLogic>
        <filters>
            <field>Id</field>
            <operator>EqualTo</operator>
            <value>
                <elementReference>${spec.variable}</elementReference>
            </value>
        </filters>
        <getFirstRecordOnly>true</getFirstRecordOnly>
        <object>${objectName}</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordLookups>
    <recordUpdates>
        <name>${spec.update}</name>
        <label>Different label ${spec.update}</label>
        <locationX>${locationX}</locationX>
        <locationY>350</locationY>
        ${updateConnector}
        <filterLogic>and</filterLogic>
        <filters>
            <field>Id</field>
            <operator>EqualTo</operator>
            <value>
                <elementReference>${spec.variable}</elementReference>
            </value>
        </filters>
        <inputAssignments>
            <field>Description</field>
            <value>
                <elementReference>${spec.variable}</elementReference>
            </value>
        </inputAssignments>
        <object>${objectName}</object>
    </recordUpdates>
    <start>
        <locationX>50</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>${spec.lookup}</targetReference>
        </connector>
    </start>
    <status>Active</status>
    <variables>
        <name>${spec.variable}</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
</Flow>`;
}

function branchedCopy(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>64.0</apiVersion>
    <decisions>
        <name>Split</name>
        <label>Split</label>
        <locationX>176</locationX>
        <locationY>100</locationY>
        <defaultConnector>
            <targetReference>Right_Get</targetReference>
        </defaultConnector>
        <defaultConnectorLabel>Right</defaultConnectorLabel>
        <rules>
            <name>Go_Left</name>
            <conditionLogic>and</conditionLogic>
            <conditions>
                <leftValueReference>$Record.Name</leftValueReference>
                <operator>IsNull</operator>
                <rightValue>
                    <booleanValue>false</booleanValue>
                </rightValue>
            </conditions>
            <connector>
                <targetReference>Left_Get</targetReference>
            </connector>
            <label>Left</label>
        </rules>
    </decisions>
    <decisions>
        <name>Left_Check</name>
        <label>Left check</label>
        <locationX>50</locationX>
        <locationY>300</locationY>
        <defaultConnector>
            <targetReference>Left_Update</targetReference>
        </defaultConnector>
        <defaultConnectorLabel>Default</defaultConnectorLabel>
        <rules>
            <name>Left_Match</name>
            <conditionLogic>and</conditionLogic>
            <conditions>
                <leftValueReference>Left_Get.Active__c</leftValueReference>
                <operator>EqualTo</operator>
                <rightValue>
                    <booleanValue>true</booleanValue>
                </rightValue>
            </conditions>
            <label>Match</label>
        </rules>
    </decisions>
    <decisions>
        <name>Right_Check</name>
        <label>Right check</label>
        <locationX>400</locationX>
        <locationY>300</locationY>
        <defaultConnector>
            <targetReference>Right_Update</targetReference>
        </defaultConnector>
        <defaultConnectorLabel>Default</defaultConnectorLabel>
        <rules>
            <name>Right_Match</name>
            <conditionLogic>and</conditionLogic>
            <conditions>
                <leftValueReference>Right_Get.Active__c</leftValueReference>
                <operator>EqualTo</operator>
                <rightValue>
                    <booleanValue>true</booleanValue>
                </rightValue>
            </conditions>
            <label>Match</label>
        </rules>
    </decisions>
    <label>Split copy</label>
    <processType>AutoLaunchedFlow</processType>
    <recordLookups>
        <name>Left_Get</name>
        <label>Left get</label>
        <locationX>50</locationX>
        <locationY>200</locationY>
        <connector>
            <targetReference>Left_Check</targetReference>
        </connector>
        <filterLogic>and</filterLogic>
        <filters>
            <field>Id</field>
            <operator>EqualTo</operator>
            <value>
                <elementReference>leftId</elementReference>
            </value>
        </filters>
        <object>Account</object>
    </recordLookups>
    <recordLookups>
        <name>Right_Get</name>
        <label>Right get</label>
        <locationX>400</locationX>
        <locationY>200</locationY>
        <connector>
            <targetReference>Right_Check</targetReference>
        </connector>
        <filterLogic>and</filterLogic>
        <filters>
            <field>Id</field>
            <operator>EqualTo</operator>
            <value>
                <elementReference>rightId</elementReference>
            </value>
        </filters>
        <object>Account</object>
    </recordLookups>
    <recordUpdates>
        <name>Left_Update</name>
        <label>Left update</label>
        <locationX>50</locationX>
        <locationY>400</locationY>
        <inputAssignments>
            <field>Description</field>
            <value>
                <elementReference>leftId</elementReference>
            </value>
        </inputAssignments>
        <object>Account</object>
    </recordUpdates>
    <recordUpdates>
        <name>Right_Update</name>
        <label>Right update</label>
        <locationX>400</locationX>
        <locationY>400</locationY>
        <inputAssignments>
            <field>Description</field>
            <value>
                <elementReference>rightId</elementReference>
            </value>
        </inputAssignments>
        <object>Account</object>
    </recordUpdates>
    <start>
        <locationX>176</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Split</targetReference>
        </connector>
    </start>
    <status>Active</status>
    <variables>
        <name>leftId</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
    <variables>
        <name>rightId</name>
        <dataType>String</dataType>
        <isCollection>false</isCollection>
        <isInput>true</isInput>
        <isOutput>false</isOutput>
    </variables>
</Flow>`;
}

function writeFlows(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "duplicate-flow-logic-"));
  for (const [name, xml] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), xml);
  }
  return dir;
}
