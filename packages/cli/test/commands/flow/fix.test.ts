import { expect } from "chai";
import { Config } from "@oclif/core";
import sinon from "sinon";

import { ScanResult } from "../../../src/models/ScanResult.js";
import FlowFix from "../../../src/commands/flow/fix.js";
import CoreFixService from "../../../src/libs/CoreFixService.js";

describe("flow:fix", () => {

  // e2e test using stub
  it("runs flow:fix e2e", async () => {
    sinon
      .stub(CoreFixService.prototype, "fix")
      .resolves(["/path/to/resolved.flow-meta.xml"]);

    const config: Config = new Config({
      root: "/tmp",
      pjson: {
        name: "test-cli",
        version: "0.0.1",
        oclif: { bin: "test-cli" },
      },
    });
    await config.load();

    const scanResult: ScanResult = await new FlowFix(
      ["-r", "UnusedVariable", "-d", "."],
      config
    ).run();

    expect(scanResult.summary.message).to.contain(
      "Fixed /path/to/resolved.flow-meta.xml"
    );
  });

  // direct class call to check mutually exclusive flags
  it("throws for mutually exclusive flags (direct class call)", async () => {
    const config: Config = new Config({
      root: "/tmp",
      pjson: {
        name: "test-cli",
        version: "0.0.1",
        oclif: { bin: "test-cli" },
      },
    });
    await config.load();

    try {
      await new FlowFix(
        [
          "-r", "UnusedVariable",
          "-d", ".", "./src",
          "-f", "./test/commands/flow/fix.test.ts",
        ],
        config
      ).run();
    } catch (e: any) {
      expect(e.message).to.contain("cannot also be provided when using");
      expect(e.message).to.contain("--file");
      expect(e.message).to.contain("--dir");
      return;
    }

    throw new Error("Expected error not thrown");
  });

});
