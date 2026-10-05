import { Flow } from "./Flow";
import { FlowNode } from "./FlowNode";
import { FlowVariable } from "./FlowVariable";
import {
  asArray,
  baseVariable,
  extractMergeFields,
  valueReference,
} from "../libs/ReferenceExtractor";

/** Variables an element reads (consumes) and writes (defines), by base name. */
export interface NodeDefUse {
  reads: Set<string>;
  writes: Set<string>;
}

/** The data-flow boundary of a subflow call: caller -> callee input mapping.
 * (Output-side mapping is intentionally absent: callee outputs are tracked
 * conservatively as plain writes of the subflow call node.) */
export interface SubflowBoundary {
  /** Name of the subflow call node in the parent flow. */
  nodeName: string;
  /** API name of the referenced (callee) flow. */
  flowName?: string;
  /** For each callee input variable, the caller references feeding it. */
  inputs: Array<{ calleeVar: string; callerRefs: string[] }>;
}

/**
 * Def-use / data-flow layer over a single Flow.
 *
 * For every element it computes which flow variables are read and written,
 * resolves formula variables to their underlying references, records subflow
 * call boundaries (for interprocedural analysis), and tracks input/screen
 * variables that can act as taint sources. Reads/writes are stored as *base*
 * variable names (`Account.Name` -> `Account`), an intentional over-approximation.
 */
export class FlowDataFlow {
  private nodes = new Map<string, NodeDefUse>();
  private formulaRefs = new Map<string, Set<string>>();
  private subflowBoundaries = new Map<string, SubflowBoundary>();
  private inputVariableNames = new Set<string>();
  private screenInputNames = new Set<string>();

  constructor(flow: Flow) {
    this.build(flow);
  }

  /** Read/write sets for a node, or undefined if the node produced no data-flow. */
  public getNode(nodeName: string): NodeDefUse | undefined {
    return this.nodes.get(nodeName);
  }

  public reads(nodeName: string): Set<string> {
    return this.nodes.get(nodeName)?.reads ?? new Set();
  }

  public writes(nodeName: string): Set<string> {
    return this.nodes.get(nodeName)?.writes ?? new Set();
  }

  /** Base references a formula variable is derived from (empty if not a formula). */
  public getFormulaRefs(formulaName: string): Set<string> {
    return this.formulaRefs.get(formulaName) ?? new Set();
  }

  public isFormula(name: string): boolean {
    return this.formulaRefs.has(name);
  }

  public getFormulaNames(): string[] {
    return Array.from(this.formulaRefs.keys());
  }

  /** Every subflow call boundary in the flow. */
  public getSubflowBoundaries(): SubflowBoundary[] {
    return Array.from(this.subflowBoundaries.values());
  }

  public getSubflowBoundary(nodeName: string): SubflowBoundary | undefined {
    return this.subflowBoundaries.get(nodeName);
  }

  /** Flow input variables (isInput) — candidate taint sources. */
  public getInputVariables(): Set<string> {
    return this.inputVariableNames;
  }

  /** Screen input field names — user-entered, candidate taint sources. */
  public getScreenInputs(): Set<string> {
    return this.screenInputNames;
  }

  private build(flow: Flow): void {
    for (const element of flow.elements) {
      if (element instanceof FlowNode) {
        this.processNode(element);
      } else if (element instanceof FlowVariable) {
        this.processVariable(element);
      }
    }
  }

  private processVariable(variable: FlowVariable): void {
    if (variable.subtype === "formulas") {
      const refs = new Set<string>();
      for (const ref of extractMergeFields(variable.value)) {
        this.addBase(refs, ref);
      }
      this.formulaRefs.set(variable.name, refs);
    } else if (variable.subtype === "variables" && variable.isInput) {
      this.inputVariableNames.add(variable.name);
    }
  }

  private processNode(node: FlowNode): void {
    const reads = new Set<string>();
    const writes = new Set<string>();
    const el = node.element as Record<string, any>;

    switch (node.subtype) {
      case "assignments":
        this.processAssignments(el, reads, writes);
        break;
      case "decisions":
        this.processDecisions(el, reads);
        break;
      case "recordLookups":
        this.processRecordLookup(node, el, reads, writes);
        break;
      case "recordCreates":
        this.processRecordWrite(node, el, reads, writes, true);
        break;
      case "recordUpdates":
        this.processRecordWrite(node, el, reads, writes, false);
        break;
      case "recordDeletes":
        this.addFilterReads(el, reads);
        this.addBase(reads, el?.inputReference);
        break;
      case "loops":
        this.addBase(reads, el?.collectionReference);
        // The loop defines a "current item" variable named after itself.
        writes.add(node.name);
        break;
      case "subflows":
        this.processSubflow(node, el, reads, writes);
        break;
      case "actionCalls":
      case "apexPluginCalls":
        this.processActionCall(node, el, reads, writes);
        break;
      case "screens":
        this.processScreen(el, reads, writes);
        break;
      case "customErrors":
        this.processCustomError(el, reads);
        break;
    }

    if (reads.size > 0 || writes.size > 0) {
      this.nodes.set(node.name, { reads, writes });
    }
  }

  private processAssignments(
    el: Record<string, any>,
    reads: Set<string>,
    writes: Set<string>
  ): void {
    for (const item of asArray(el?.assignmentItems)) {
      const target = item?.assignToReference;
      this.addBase(writes, target);
      // Compound operators (Add/Subtract/...) read the target before writing it.
      if (item?.operator && item.operator !== "Assign") {
        this.addBase(reads, target);
      }
      this.addBase(reads, valueReference(item?.value));
    }
  }

  private processDecisions(el: Record<string, any>, reads: Set<string>): void {
    for (const rule of asArray(el?.rules)) {
      for (const condition of asArray(rule?.conditions)) {
        this.addBase(reads, condition?.leftValueReference);
        this.addBase(reads, valueReference(condition?.rightValue));
      }
    }
  }

  private processRecordLookup(
    node: FlowNode,
    el: Record<string, any>,
    reads: Set<string>,
    writes: Set<string>
  ): void {
    this.addFilterReads(el, reads);
    if (this.isAutoStored(el)) {
      writes.add(node.name);
    } else if (el?.outputReference) {
      this.addBase(writes, el.outputReference);
    }
    for (const oa of asArray(el?.outputAssignments)) {
      this.addBase(writes, oa?.assignToReference);
    }
  }

  private processRecordWrite(
    node: FlowNode,
    el: Record<string, any>,
    reads: Set<string>,
    writes: Set<string>,
    isCreate: boolean
  ): void {
    this.addBase(reads, el?.inputReference);
    for (const ia of asArray(el?.inputAssignments)) {
      this.addBase(reads, valueReference(ia?.value));
    }
    this.addFilterReads(el, reads);
    // A create with automatic output binds the new record (its Id) to its own name.
    if (isCreate && this.isAutoStored(el)) {
      writes.add(node.name);
    }
  }

  private processSubflow(
    node: FlowNode,
    el: Record<string, any>,
    reads: Set<string>,
    writes: Set<string>
  ): void {
    const boundary: SubflowBoundary = {
      nodeName: node.name,
      flowName: node.flowName,
      inputs: [],
    };
    for (const ia of asArray(el?.inputAssignments)) {
      const ref = valueReference(ia?.value);
      this.addBase(reads, ref);
      if (ia?.name) {
        boundary.inputs.push({
          calleeVar: ia.name,
          callerRefs: ref ? [baseVariable(ref)] : [],
        });
      }
    }
    for (const oa of asArray(el?.outputAssignments)) {
      this.addBase(writes, oa?.assignToReference);
    }
    this.subflowBoundaries.set(node.name, boundary);
  }

  private processActionCall(
    node: FlowNode,
    el: Record<string, any>,
    reads: Set<string>,
    writes: Set<string>
  ): void {
    for (const ip of asArray(el?.inputParameters)) {
      this.addBase(reads, valueReference(ip?.value));
    }
    for (const op of asArray(el?.outputParameters)) {
      this.addBase(writes, op?.assignToReference);
    }
    if (this.isAutoStored(el)) {
      writes.add(node.name);
    }
  }

  private processScreen(
    el: Record<string, any>,
    reads: Set<string>,
    writes: Set<string>
  ): void {
    this.walkScreenFields(asArray(el?.fields), reads, writes);
  }

  private walkScreenFields(
    fields: any[],
    reads: Set<string>,
    writes: Set<string>
  ): void {
    for (const field of fields) {
      if (!field) continue;
      // Input components produce a user-entered value referenceable by their name;
      // display-only components (text/rich text/dividers) do not.
      if (field.name && this.isScreenInputField(field)) {
        writes.add(field.name);
        this.screenInputNames.add(field.name);
      }
      this.addBase(reads, valueReference(field.defaultValue));
      for (const ref of extractMergeFields(field.fieldText)) {
        this.addBase(reads, ref);
      }
      // Sections/columns nest additional fields.
      if (field.fields) {
        this.walkScreenFields(asArray(field.fields), reads, writes);
      }
    }
  }

  private static readonly DISPLAY_ONLY_FIELD_TYPES = new Set([
    "DisplayText",
    "DisplayRichText",
    "Divider",
  ]);

  private isScreenInputField(field: Record<string, any>): boolean {
    if (FlowDataFlow.DISPLAY_ONLY_FIELD_TYPES.has(field.fieldType)) return false;
    // Anything that captures or stores a value: input fields, component
    // instances with automatic output, or fields declaring a data type.
    return (
      !!field.dataType ||
      field.storeOutputAutomatically === true ||
      field.storeOutputAutomatically === "true" ||
      field.fieldType === "InputField" ||
      field.fieldType === "PasswordField" ||
      field.fieldType === "ComponentInstance"
    );
  }

  private processCustomError(el: Record<string, any>, reads: Set<string>): void {
    for (const message of asArray(el?.customErrorMessages)) {
      for (const ref of extractMergeFields(message?.errorMessage)) {
        this.addBase(reads, ref);
      }
    }
  }

  private addFilterReads(el: Record<string, any>, reads: Set<string>): void {
    for (const filter of asArray(el?.filters)) {
      this.addBase(reads, valueReference(filter?.value));
    }
  }

  private isAutoStored(el: Record<string, any>): boolean {
    const v = el?.storeOutputAutomatically;
    return v === true || v === "true";
  }

  private addBase(target: Set<string>, reference: unknown): void {
    if (typeof reference !== "string" || reference.length === 0) return;
    const base = baseVariable(reference);
    if (base) target.add(base);
  }
}
