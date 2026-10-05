import * as core from "../src";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import { describe, it, expect } from "@jest/globals";

describe("FlowDocumentation", () => {
  const example_uri = path.join(__dirname, "../../../example-flows/force-app/demo/Demo_Old_API_Version.flow-meta.xml");
  const fixed_uri = path.join(__dirname, "../../../example-flows/force-app/testing/Outdated_API_Version_Fixed.flow-meta.xml");

  it("should generate markdown for a single flow with default options", async () => {
    const parsed = await core.parse([example_uri]);
    const md = core.exportDiagram(parsed);
    
    expect(md).toContain("# Flow Documentation");
    expect(md).toContain("## Demo_Old_API_Version");
    expect(md).toContain("```mermaid");
    expect(md).toMatch(/flowchart TB/);  // Updated to match current Mermaid syntax
    // Check no errors section since parse should succeed
    expect(md).not.toContain("## Parse Errors");
  });

  it("should generate markdown with custom options", async () => {
    const parsed = await core.parse([fixed_uri]);
    const options = {
      includeDetails: true,
      includeMarkdownDocs: true,
      collapsedDetails: true
    };
    const md = core.exportDiagram(parsed, options);
    
    expect(md).toContain("# Flow Documentation");
    expect(md).toContain("## Outdated_API_Version_Fixed");
    expect(md).toContain("```mermaid");
    // Assuming visualize with these options includes details like <details> tags
    expect(md).toMatch(/<details>/);
    expect(md).not.toContain("## Parse Errors");
  });

  it("should handle multiple flows", async () => {
    const parsed = await core.parse([example_uri, fixed_uri]);
    const md = core.exportDiagram(parsed);
    
    expect(md).toContain("# Flow Documentation");
    expect(md).toContain("## Demo_Old_API_Version");
    expect(md).toContain("## Outdated_API_Version_Fixed");
    expect(md).toContain("```mermaid");
    expect(md).not.toContain("No valid flows found.");
  });

  it("should include parse errors if any", async () => {
    const invalid_uri = path.join(__dirname, "non-existent-file.xml");
    const parsed = await core.parse([example_uri, invalid_uri]);
    const md = core.exportDiagram(parsed);
    
    expect(md).toContain("# Flow Documentation");
    expect(md).toContain("## Demo_Old_API_Version");
    expect(md).toContain("## Parse Errors");
    expect(md).toContain(`- ${invalid_uri}`);
    expect(md).toContain("ENOENT"); // Part of file not found error
  });

  it("should handle no valid flows", async () => {
    const invalid_uri = path.join(__dirname, "non-existent-file.xml");
    const parsed = await core.parse([invalid_uri]);
    const md = core.exportDiagram(parsed);
    
    expect(md).toContain("# Flow Documentation");
    expect(md).toContain("No valid flows found.");
    expect(md).toContain("## Parse Errors");
    expect(md).toContain(`- ${invalid_uri}`);
  });
});