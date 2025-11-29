import { convertFlowNodes } from "./ConvertFlowNodes";

export function BuildFlow(nodesToMerge) {
  let res = {};
  for (const nodeToMerge of nodesToMerge) {
    const subtype = nodeToMerge.subtype;
    const nodesOfType = nodesToMerge.filter((node) => subtype === node.subtype);
    res = convertFlowNodes(res, nodesOfType, subtype);
  }
  return res;
}
