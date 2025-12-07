import * as core from "../internals/internals";
import { RuleCommon } from "../models/RuleCommon";
import { IRuleDefinition } from "../interfaces/IRuleDefinition";
export class AutoLayout extends RuleCommon implements IRuleDefinition {
  constructor() {
    super({
      name: "AutoLayout",
      label: "Auto-Layout Mode",
      description:
        "With Canvas Mode set to Auto-Layout, Elements are spaced, connected, and aligned automatically, keeping your Flow neatly organized thus saving you time.",
      supportedTypes: core.FlowType.allTypes(),
      docRefs: [],
    });
  }
  
  protected check(
    flow: core.Flow,
    _options: object | undefined
  ): core.Violation[] {
    if (!flow.processMetadataValues) return [];

    const CanvasMode = flow.xmldata.processMetadataValues.find(
      (mdv) => mdv.name === "CanvasMode"
    );

    const autoLayout =
      CanvasMode?.value &&
      typeof CanvasMode.value === "object" &&
      CanvasMode.value.stringValue === "AUTO_LAYOUT_CANVAS";

    if (autoLayout) return [];

    return [
      new core.Violation(
        new core.FlowAttribute(
          CanvasMode?.value?.stringValue ?? "undefined",
          "CanvasMode",
          "!== AUTO_LAYOUT_CANVAS"
        )
      )
    ];
  }

}