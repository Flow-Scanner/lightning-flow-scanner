import { Flow } from "../models/Flow";
import { FlowNode } from "../models/FlowNode";
import { Violation } from "../models/Violation";

const MIN_WINDOW = 3;
const MAX_WINDOW = 8;
const MAX_DEPTH = 40;
const MAX_PATHS = 64;

const REFERENCE_KEYS = new Set([
  "elementReference",
  "leftValueReference",
  "rightValueReference",
  "assignToReference",
  "collectionReference",
  "inputReference",
  "outputReference",
  "choiceReference",
]);

const KEEP_NAME_UNDER = new Set(["inputParameters", "outputParameters", "fields"]);

interface RenameCtx {
  localNames: Set<string>;
  ids: Map<string, string>;
}

interface Occurrence {
  flow: Flow;
  names: string[];
}

interface MatchGroup {
  occurrences: Occurrence[];
}

/**
 * Find copied stretches of flow logic.
 *
 * A match is a connected chain of at least three elements that shows up twice.
 * Element API names, labels, descriptions, and canvas positions are ignored.
 * Variable and element references inside the chain are renamed in the order
 * they appear, so a copy with different names still matches.
 */
export function duplicateLogicViolations(flows: Flow[]): Map<Flow, Violation[]> {
  const groups = maximalGroups(collectGroups(flows));
  const byFlow = new Map<Flow, Violation[]>();

  for (const group of groups) {
    for (const occurrence of group.occurrences) {
      const node = occurrence.flow.graph.getNode(occurrence.names[0]);
      if (!node) continue;
      const others = group.occurrences.filter((item) => item !== occurrence);
      const text = `Also in ${others.map(describeOccurrence).join("; ")}`;
      const violation = new Violation(node);
      violation.details = {
        ...(violation.details ?? {}),
        expression: text,
        summary: text,
      };
      const list = byFlow.get(occurrence.flow) ?? [];
      list.push(violation);
      byFlow.set(occurrence.flow, list);
    }
  }

  return byFlow;
}

function describeOccurrence(occurrence: Occurrence): string {
  return `${occurrence.flow.name} (${occurrence.names.join(" > ")})`;
}

function collectGroups(flows: Flow[]): MatchGroup[] {
  const grouped = new Map<string, Occurrence[]>();

  for (const flow of flows) {
    const seen = new Set<string>();
    for (const names of collectWindows(flow)) {
      const rangeKey = names.join("\0");
      if (seen.has(rangeKey)) continue;
      seen.add(rangeKey);
      const signature = windowSignature(flow, names);
      const list = grouped.get(signature) ?? [];
      list.push({ flow, names });
      grouped.set(signature, list);
    }
  }

  const groups: MatchGroup[] = [];
  for (const occurrences of grouped.values()) {
    if (occurrences.length < 2) continue;
    groups.push({ occurrences });
  }
  return groups;
}

function maximalGroups(groups: MatchGroup[]): MatchGroup[] {
  const byLength = [...groups].sort(
    (a, b) => b.occurrences[0].names.length - a.occurrences[0].names.length
  );
  const kept: MatchGroup[] = [];

  for (const group of byLength) {
    const coveredByLonger = group.occurrences.every((occurrence) =>
      kept.some((longer) =>
        longer.occurrences.some(
          (other) => other.flow === occurrence.flow && isSubarray(occurrence.names, other.names)
        )
      )
    );
    if (coveredByLonger) continue;

    const overlapsKept = group.occurrences.every((occurrence) =>
      kept.some(
        (otherGroup) =>
          sameFlows(otherGroup, group) &&
          otherGroup.occurrences.some(
            (other) =>
              other.flow === occurrence.flow && sharesElement(occurrence.names, other.names)
          )
      )
    );
    if (overlapsKept) continue;

    kept.push(group);
  }

  return kept;
}

function sameFlows(a: MatchGroup, b: MatchGroup): boolean {
  const names = (group: MatchGroup) =>
    [...new Set(group.occurrences.map((item) => item.flow.name))].sort().join("\0");
  return names(a) === names(b);
}

function isSubarray(small: string[], big: string[]): boolean {
  if (small.length >= big.length) return false;
  for (let start = 0; start + small.length <= big.length; start++) {
    if (small.every((name, index) => big[start + index] === name)) return true;
  }
  return false;
}

function sharesElement(left: string[], right: string[]): boolean {
  const names = new Set(left);
  return right.some((name) => names.has(name));
}

function collectWindows(flow: Flow): string[][] {
  const start = flow.startReference;
  if (!start || !flow.graph.getNode(start)) return [];

  const windows: string[][] = [];
  let paths = 0;

  const emit = (path: string[]) => {
    const longest = Math.min(MAX_WINDOW, path.length);
    for (let length = MIN_WINDOW; length <= longest; length++) {
      for (let startIndex = 0; startIndex + length <= path.length; startIndex++) {
        windows.push(path.slice(startIndex, startIndex + length));
      }
    }
  };

  const walk = (name: string, path: string[]) => {
    if (paths >= MAX_PATHS) return;
    if (path.includes(name)) {
      emit(path);
      paths++;
      return;
    }

    const nextPath = path.concat(name);
    const next = flow.graph.getNextElements(name).filter((target) => flow.graph.getNode(target));
    if (next.length === 0 || nextPath.length >= MAX_DEPTH) {
      emit(nextPath);
      paths++;
      return;
    }

    for (const target of next) {
      if (paths >= MAX_PATHS) return;
      walk(target, nextPath);
    }
  };

  walk(start, []);
  return windows;
}

function windowSignature(flow: Flow, names: string[]): string {
  const ctx: RenameCtx = {
    localNames: new Set(flow.elements.map((element) => element.name)),
    ids: new Map(),
  };
  return names
    .map((name) => {
      const node = flow.graph.getNode(name) as FlowNode;
      return `${node.subtype}:${JSON.stringify(canonicalize(node.element, ctx))}`;
    })
    .join("|");
}

function canonicalize(value: unknown, ctx: RenameCtx, parentKey?: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item, ctx, parentKey));
  }
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (dropKey(key, parentKey)) continue;
      const child = source[key];
      normalized[key] = REFERENCE_KEYS.has(key)
        ? renameReference(String(child ?? ""), ctx)
        : canonicalize(child, ctx, key);
    }
    return normalized;
  }
  if (typeof value === "string") return renameFormula(value, ctx);
  return value;
}

function dropKey(key: string, parentKey?: string): boolean {
  if (key.startsWith("@_") || key === "#text") return true;
  if (key === "label" || key === "description" || key === "helpText" || key === "fieldText")
    return true;
  if (key === "locationX" || key === "locationY" || key === "defaultConnectorLabel") return true;
  if (key === "connector" || key.endsWith("Connector")) return true;
  if (key === "name" && !KEEP_NAME_UNDER.has(parentKey ?? "")) return true;
  return false;
}

function renameReference(value: string, ctx: RenameCtx): string {
  if (!value || value.startsWith("$")) return value;
  const head = value.split(".")[0];
  if (!ctx.localNames.has(head)) return value;
  return `${referenceId(head, ctx)}${value.slice(head.length)}`;
}

function renameFormula(value: string, ctx: RenameCtx): string {
  return value.replace(/\{!([A-Za-z_][\w$]*)/g, (match, name: string) => {
    if (name.startsWith("$")) return match;
    const head = name.split(".")[0];
    if (!ctx.localNames.has(head)) return match;
    return `{!${referenceId(head, ctx)}${name.slice(head.length)}`;
  });
}

function referenceId(name: string, ctx: RenameCtx): string {
  const existing = ctx.ids.get(name);
  if (existing) return existing;
  const id = `v${ctx.ids.size + 1}`;
  ctx.ids.set(name, id);
  return id;
}
