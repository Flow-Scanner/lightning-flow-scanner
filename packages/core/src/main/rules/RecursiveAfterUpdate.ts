import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
export class RecursiveAfterUpdate extends RuleCommon implements IRuleDefinition {
  protected qualifiedRecordTriggerTypes: Set<string> = new Set<string>([
    "Create",
    "CreateAndUpdate",
    "Update",
  ]);
  constructor() {
    super(
      {
        description:
          "After updates are meant to be used for record modifications that are not the same record that triggered the flow. Using after updates on the same record can lead to recursion and unexpected behavior. Consider using before save flows for same record updates.",
        docRefs: [
          {
            label: "Learn about same record field updates",
            path: "https://architect.salesforce.com/decision-guides/trigger-automation#Same_Record_Field_Updates",
          },
        ],
        label: "Recursive After Update",
        name: "RecursiveAfterUpdate",
        supportedTypes: [...core.FlowType.backEndTypes],
      },
      { severity: "warning" }
    );
  }
  protected check(
    flow: core.Flow,
    _options: object | undefined,
    suppressions: Set<string>
  ): core.Violation[] {
    const results: core.Violation[] = [];

    const triggerType = this.getStartProperty(flow, 'triggerType');
    const recordTriggerType = this.getStartProperty(flow, 'recordTriggerType');

    const isAfterSave = triggerType === "RecordAfterSave";
    const isQualifiedTriggerTypes = this.qualifiedRecordTriggerTypes.has(recordTriggerType);

    if (!isAfterSave || !isQualifiedTriggerTypes) {
      return results;
    }
    const potentialElements = flow.elements?.filter(
      (node) => node.subtype === "recordUpdates"
    ) as core.FlowNode[];
    if (potentialElements == null || typeof potentialElements[Symbol.iterator] !== "function") {
      return results;
    }
    // === $Record updates ===
    for (const node of potentialElements) {
      if (
        typeof node.element === "object" &&
        "inputReference" in node.element &&
        node.element.inputReference === "$Record"
      ) {
        if (!suppressions.has(node.name)) {
          results.push(new core.Violation(node));
        }
      }
    }
    // === Lookup → same object type updates ===
    const flowObject = this.getStartProperty(flow, 'object');
    const lookupElementsWithTheSameObjectType = flow.elements
      ?.filter(
        (node) =>
          node.subtype === "recordLookups" &&
          typeof node.element === "object" &&
          "object" in node.element &&
          flowObject  === node.element["object"]
      )
      ?.map((node) => node.name);
    if (
      lookupElementsWithTheSameObjectType == null ||
      typeof lookupElementsWithTheSameObjectType[Symbol.iterator] !== "function"
    ) {
      return results;
    }
    for (const node of potentialElements) {
      if (
        typeof node.element === "object" &&
        "inputReference" in node.element &&
        lookupElementsWithTheSameObjectType.includes(node.element.inputReference as string)
      ) {
        if (!suppressions.has(node.name)) {
          results.push(new core.Violation(node));
        }
      }
    }
    return results;
  }
}