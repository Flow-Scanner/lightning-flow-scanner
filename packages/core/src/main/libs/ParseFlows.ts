import { promises as fs } from "fs";
import * as p from "path";

import { Flow } from "../models/Flow";
import { ParsedFlow } from "../models/ParsedFlow";
import { createFlowParser } from "./ParseFlowXml";


export async function parse(selectedUris: string[]): Promise<ParsedFlow[]> {
  const parseResults: ParsedFlow[] = [];
  const parser = createFlowParser();

  for (const uri of selectedUris) {
    try {
      const normalizedURI = p.normalize(uri);
      const content = await fs.readFile(normalizedURI, "utf8");
      const parsed = parser.parse(content);
      const flowObj = parsed.Flow;
      parseResults.push(new ParsedFlow(uri, new Flow(uri, flowObj)));
    } catch (e: any) {
      parseResults.push(
        new ParsedFlow(uri, undefined, e.message ?? e.toString())
      );
    }
  }
  return parseResults;
}