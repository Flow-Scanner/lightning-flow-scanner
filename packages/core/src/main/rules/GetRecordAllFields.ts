import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";

export class GetRecordAllFields extends RuleCommon implements IRuleDefinition {
  constructor() {
    super(
      {
        description:
          "Following the principle of least privilege (PoLP), avoid using Get Records with 'Automatically store all fields' unless necessary.",
        docRefs: [
          {
            label: "SOQL and SOSL | Best Practices for Deployments with Large Data Volumes",
            path: "https://developer.salesforce.com/docs/atlas.en-us.salesforce_large_data_volumes_bp.meta/salesforce_large_data_volumes_bp/ldv_deployments_best_practices_soql_and_sosl.htm",
          },
          {
            label: "Indexes | Best Practices",
            path: "https://developer.salesforce.com/docs/atlas.en-us.salesforce_large_data_volumes_bp.meta/salesforce_large_data_volumes_bp/ldv_deployments_infrastructure_indexes.htm",
          },
        ],
        label: "Get Record All Fields",
        name: "GetRecordAllFields",
        supportedTypes: core.FlowType.allTypes(),
      },
      { severity: "warning" }
    );
  }

  protected check(
  flow: core.Flow,
  _options: object | undefined,
  _suppressions: Set<string>
): core.Violation[] {
  const lookupNodes = flow.elements?.filter(
    (e) => e.subtype === "recordLookups"
  ) ?? [];

  const violations = lookupNodes
    .filter((node) => {
      const el = (node as core.FlowNode).element as core.FlowElement;

      const storeAllFields =
        typeof el === "object" &&
        "storeOutputAutomatically" in el &&
        el.storeOutputAutomatically;

      const hasQueriedFields =
        typeof el === "object" &&
        Array.isArray((el as any).queriedFields) &&
        (el as any).queriedFields.length > 0;

      return storeAllFields && !hasQueriedFields;
    })
    .map((node) => new core.Violation(node));

  return violations;
}

}
