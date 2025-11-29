/**
 * Represents the different types of Salesforce Flows and provides utility methods
 * to categorize and retrieve them.
 *
 * @remarks
 * This class defines static properties for various flow types, including backend,
 * process builder, survey, visual, and unsupported types. It also provides a method
 * to retrieve all supported flow types.
 *
 * @example
 * ```typescript
 * const allFlowTypes = FlowType.allTypes();
 * ```
 */
export class FlowType {
  public static readonly autolaunchedType = "AutoLaunchedFlow";

  public static readonly backEndTypes = [
    this.autolaunchedType,
    "CustomEvent",
    "InvocableProcess",
    "Orchestrator",
    "EvaluationFlow",
    "ActionCadenceAutolaunchedFlow",
  ];
  public static readonly processBuilder = ["Workflow"];
  public static readonly surveyTypes = ["Survey"];
  public static readonly unsupportedTypes = [
    "CheckoutFlow",
    "FSCLending",
    "FSCLending",
    "LoyaltyManagementFlow",
  ];
  public static readonly visualTypes = [
    "Flow",
    "IndividualObjectLinkingFlow",
    "LoginFlow",
    "RoutingFlow",
    "Appointments",
    "ActionCadenceStepFlow",
    "ContactRequestFlow",
    "ContactRequestFlow",
    "CustomerLifecycle",
    "FieldServiceMobile",
    "FieldServiceWeb",
    "SurveyEnrich",
  ];

  public static readonly allTypes = function () {
    return [...this.backEndTypes, ...this.visualTypes, ...this.surveyTypes];
  };
}
