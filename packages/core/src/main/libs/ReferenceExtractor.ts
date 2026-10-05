/**
 * Helpers for pulling variable references out of raw Flow element data.
 *
 * Flow elements reference variables in two syntaxes:
 *  - structured `<value><elementReference>Var</elementReference></value>` nodes, and
 *  - `{!Var}` merge fields embedded in formula expressions and screen text.
 *
 * A reference may address a field on an sObject/apex variable (`Account.Name`,
 * `$Record.OwnerId`). The *base* variable is the token before the first `.`.
 */

/** Merge-field pattern: matches `{!referenceName}` and captures the inner reference. */
const MERGE_FIELD_PATTERN = /\{!([^}]+)\}/g;

/** Global/system references (`$Record`, `$User`, `$Flow`, `$Api`, ...) start with `$`. */
export function isGlobalReference(base: string): boolean {
  return base.startsWith("$");
}

/**
 * Reduce a reference token to its base variable name.
 * `Loop_Accounts.AnnualRevenue` -> `Loop_Accounts`; `MyVar` -> `MyVar`.
 */
export function baseVariable(reference: string): string {
  const token = reference.trim();
  if (!token) return "";
  const dot = token.indexOf(".");
  return dot === -1 ? token : token.slice(0, dot);
}

/** Normalize a value that fast-xml-parser may emit as a single object or an array. */
export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Extract the referenced variable from a Flow `<value>` node, if it is a
 * reference rather than a literal (`stringValue`, `numberValue`, ...).
 */
export function valueReference(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const ref = (value as Record<string, unknown>).elementReference;
  return typeof ref === "string" && ref.length > 0 ? ref : undefined;
}

/** Extract every `{!reference}` merge field from a block of text. */
export function extractMergeFields(text: unknown): string[] {
  if (typeof text !== "string" || text.indexOf("{!") === -1) return [];
  const refs: string[] = [];
  MERGE_FIELD_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MERGE_FIELD_PATTERN.exec(text)) !== null) {
    const inner = match[1].trim();
    if (inner) refs.push(inner);
  }
  return refs;
}
