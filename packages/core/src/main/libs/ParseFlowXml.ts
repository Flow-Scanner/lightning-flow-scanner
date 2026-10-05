import { XMLParser } from "fast-xml-parser";
import { Flow } from "../models/Flow";

/**
 * Create the XML parser configured for Salesforce Flow metadata.
 * Shared by the filesystem parser and the browser-safe string parser so both
 * produce identical element structures.
 */
export function createFlowParser(): XMLParser {
  return new XMLParser({
    attributeNamePrefix: "@_",
    ignoreAttributes: false,
    // @ts-expect-error legacy option retained for compatibility
    ignoreNameSpace: false,
    parseTagValue: false,
    textNodeName: "#text",
  });
}

/**
 * Parse raw Flow XML into a Flow. Browser-safe (no filesystem) — use this when
 * flow content comes from an org API, a network fetch, or memory rather than disk.
 *
 * @param nameOrUri - flow API name (or path) used to identify the flow
 * @param xml - the raw `.flow-meta.xml` content
 */
export function parseFlowXml(nameOrUri: string, xml: string): Flow {
  const parsed = createFlowParser().parse(xml);
  return new Flow(nameOrUri, parsed?.Flow ?? parsed);
}
