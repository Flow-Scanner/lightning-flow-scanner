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
   * Indicates whether the rule can be automatically fixed.
   * When the rule is autofixable, implement @see {AutoFixable}
   */
  public autoFixable: boolean;

  /**
   * A human-readable description of the rule.
   */
  public description: string;

  /**
   * An array of documentation references related to the rule.
   */
  public docRefs: Array<{ label: string; path: string }>;

  /**
   * Specifies if the rule's behavior can be configured.
   * When configurable, execute should take in a second parameter @see RuleDefinitionExpression
   * @example
   * ```typescript
   * public execute(flow: core.Flow, options?: { expression: string }): core.RuleResult {
   *   // your rule
   * }
   */
  public isConfigurable: boolean;

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
