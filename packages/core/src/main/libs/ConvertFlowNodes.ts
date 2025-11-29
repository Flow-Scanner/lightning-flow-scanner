export function convertFlowNodes(obj, nodes, key) {
  obj[key] = nodes.map((node) => node.element);
  return obj;
}
