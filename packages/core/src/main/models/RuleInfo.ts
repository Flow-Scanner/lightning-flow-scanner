export type RuleDefinitionExpression = {
  options?: {
    expression?: unknown;
  };
};

/**
 * Represents a rule metadata; this contains properties to describe the rule
 */
export class RuleInfo {
  /**
   * A human-readable description of the rule.
   */
  public description: string;

  /**
   * An array of documentation references related to the rule.
   */
  public docRefs: Array<{ label: string; path: string }>;

  /**
   * The display label for the rule.
   * This property is being displayed on sf cli and on vsce
   */
  public label: string;

  /**
   * The unique name identifier for the rule.
   */
  public name: string;

  /**
   * The types supported by this rule (e.g., Flow, Process).
   * Use defined types in @see FlowType
   */
  public supportedTypes: string[];

  /**
   * (Optional) The element that can be used to suppress this rule.
   * @see AdvancedSuppression
   */
  public suppressionElement?: string;
}
