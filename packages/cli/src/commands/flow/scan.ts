import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages } from "@salesforce/core";
import chalk from "chalk";
import { loadScannerOptions } from "../../libs/ScannerConfig.js";
import { FindFlows } from "../../libs/FindFlows.js";
import { ScanResult as Output } from "../../models/ScanResult.js";
import pkg, {
  ParsedFlow,
  ScanResult,
} from "@flow-scanner/lightning-flow-scanner-core";
import { stringify as csvStringify } from "csv-stringify/sync";

const {
  parse: parseFlows,
  scan: scanFlows,
  exportSarif: exportSarif,
  exportDetails: exportDetails,
} = pkg;

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages("lightning-flow-scanner", "command");

export default class Scan extends SfCommand<Output> {
  public static description = messages.getMessage("commandDescription");
  public static examples: string[] = [
    "sf flow scan",
    "sf flow scan --threshold warning",
    "sf flow scan -c path/to/config.json",
    "sf flow scan -c path/to/config.json --json",
    "sf flow scan -c path/to/config.json --threshold warning",
    "sf flow scan -d path/to/flows/directory",
    "sf flow scan --files path/to/single/file.flow-meta.xml path/to/another/file.flow-meta.xml",
    "sf flow scan -p path/to/single/file.flow-meta.xml path/to/another/file.flow-meta.xml",
    "sf flow scan --sarif > results.sarif",
    "sf flow scan --csv > results.csv",
  ];
  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  public static requiresProject = false;
  protected static supportsUsername = true;
  protected failOn = "error";
  protected static supportsRawOutput = true;
  protected errorCounters: Map<string, number> = new Map<string, number>();

  public static readonly flags = {
    config: Flags.file({
      char: "c",
      description: "Path to configuration file",
      required: false,
    }),
    directory: Flags.directory({
      char: "d",
      description: messages.getMessage("directoryToScan"),
      required: false,
      exists: true,
      exclusive: ["files"],
    }),
    threshold: Flags.option({
      char: "t",
      description:
        "Fail the command if issues of this severity or higher are found (error, warning, note, never)",
      options: ["error", "warning", "note", "never"] as const,
      default: "error",
    })(),
    failon: Flags.option({
      char: "f",
      description:
        "[DEPRECATED] Use --threshold (-t) instead. Threshold failure level (error, warning, note, or never) defining when the command return code will be 1",
      options: ["error", "warning", "note", "never"] as const,
      default: "error",
      deprecated: true,
    })(),
    files: Flags.file({
      multiple: true,
      exists: true,
      description: "List of source flows paths to scan",
      charAliases: ["p"],
      exclusive: ["directory"],
    }),
    sarif: Flags.boolean({
      char: "s",
      description: "Get SARIF output in the stdout directly",
      default: false,
      exclusive: ["csv"],
    }),
    csv: Flags.boolean({
      char: "v",
      description: "Get CSV output in the stdout directly",
      default: false,
      exclusive: ["sarif"],
    }),
    betamode: Flags.boolean({
      char: "z",
      description: "Enable beta rules at run-time (experimental)",
      default: false,
    }),
  };

  public async run(): Promise<Output> {
    const { flags } = await this.parse(Scan);
    this.failOn = flags.threshold ?? flags.failon ?? "error";

    if (flags.failon && !flags.threshold) {
      this.warn("--failon is deprecated. Use --threshold (-t) instead.");
    }

    this.spinner.start("Loading Lightning Flow Scanner");

    // ---- 1. Load config file -------------------------------------------------
    const fileConfig = await loadScannerOptions(flags.config);

    // ---- 2. Merge CLI overrides (betamode) ----------------------------------
    const mergedConfig = {
      ...fileConfig,
      betamode: flags.betamode ?? fileConfig.betamode ?? false,
    };

    // ---- 3. Locate flows ----------------------------------------------------
    const flowFiles = this.findFlows(flags.directory, flags.files);
    this.spinner.start(`Identified ${flowFiles.length} flows to scan`);

    // ---- 4. Parse flows ------------------------------------------------------
    const parsedFlows: ParsedFlow[] = await parseFlows(flowFiles);
    this.debug(`parsed flows ${parsedFlows.length}`, ...parsedFlows);

    // ---- 5. Run the scan ----------------------------------------------------
    let scanResults: ScanResult[];
    try {
      const scanConfig = {
        rules: mergedConfig.rules ?? {},
        betamode: !!mergedConfig.betamode,
      };
      scanResults = scanFlows(parsedFlows, scanConfig);
    } catch (err) {
      this.error(`Scan failed: ${(err as Error).message}`);
    }
    this.debug("Does every scanResult have fsPath?", scanResults.some(r => !r.flow?.fsPath));
    // ---- 6. Use exportDetails to get flattened results with line numbers ----
    const flatResults = exportDetails(scanResults, true); // includeDetails=true for full info
    
    // Build error counters
    this.buildErrorCounters(flatResults);

    // ---- 7. Handle output formats -------------------------------------------
    if (flags.sarif) {
      const sarif = await exportSarif(scanResults);
      this.spinner.stop();
      console.log(sarif);
    } else if (flags.csv) {
      this.spinner.stop();
      console.log(this.generateCSV(flatResults));
    } else {
      // Human-readable output
      this.spinner.stop();
      this.displayHumanReadable(flatResults, scanResults);
    }

    // ---- 8. Exit code -------------------------------------------------------
    const status = this.getStatus();
    if (status > 0) process.exitCode = status;

    const summary = {
      flowsNumber: scanResults.length,
      results: flatResults.length,
      message: `A total of ${flatResults.length} results have been found in ${scanResults.length} flows.`,
    };

    return { summary, status, results: this.convertToCliViolations(flatResults) };
  }

  private findFlows(directory?: string, sourcepath?: string[]) {
    if (directory) return FindFlows(directory);
    if (sourcepath?.length) return sourcepath;
    return FindFlows(".");
  }

  private getStatus() {
    if (this.failOn === "never") return 0;
    if (this.failOn === "error" && (this.errorCounters.get("error") ?? 0) > 0) return 1;
    if (
      this.failOn === "warning" &&
      ((this.errorCounters.get("error") ?? 0) > 0 || (this.errorCounters.get("warning") ?? 0) > 0)
    )
      return 1;
    if (
      this.failOn === "note" &&
      ((this.errorCounters.get("error") ?? 0) > 0 ||
        (this.errorCounters.get("warning") ?? 0) > 0 ||
        (this.errorCounters.get("note") ?? 0) > 0)
    )
      return 1;
    return 0;
  }

  private buildErrorCounters(flatResults: any[]) {
    this.errorCounters.clear();
    for (const result of flatResults) {
      const severity = result.severity ?? "error";
      this.errorCounters.set(severity, (this.errorCounters.get(severity) ?? 0) + 1);
    }
  }

  private generateCSV(flatResults: any[]): string {
    if (flatResults.length === 0) {
      return "No violations found";
    }

    const columns = [
      "flowFile",
      "flowName",
      "ruleName",
      "severity",
      "type",
      "name",
      "lineNumber",
      "columnNumber",
      "metaType",
    ];

    const records = flatResults.map(r => ({
      flowFile: r.flowFile ?? "",
      flowName: r.flowName ?? "",
      ruleName: r.ruleName ?? "",
      severity: r.severity ?? "error",
      type: r.type ?? "",
      name: r.name ?? "",
      lineNumber: r.lineNumber ?? "",
      columnNumber: r.columnNumber ?? "",
      metaType: r.metaType ?? "",
    }));

    return csvStringify(records, {
      header: true,
      columns: columns,
    });
  }

  private displayHumanReadable(flatResults: any[], scanResults: ScanResult[]) {
    if (flatResults.length > 0) {
      const resultsByFlow: Record<string, any[]> = {};
      for (const r of flatResults) {
        resultsByFlow[r.flowName] = resultsByFlow[r.flowName] ?? [];
        resultsByFlow[r.flowName].push({
          rule: r.ruleName,
          type: r.type,
          name: r.name,
          severity: r.severity,
          line: r.lineNumber,
          column: r.columnNumber,
        });
      }

      for (const flowName in resultsByFlow) {
        const match = scanResults.find((s) => s.flow.label === flowName);
        if (match) {
          this.styledHeader(
            `Flow: ${chalk.yellow(flowName)} ${chalk.bgYellow(
              `(${match.flow.name}.flow-meta.xml)`
            )} ${chalk.red(`(${resultsByFlow[flowName].length} results)`)}`
          );
          this.log(chalk.italic("Type: " + match.flow.type));
          this.log("");
          this.table({
            data: resultsByFlow[flowName],
            columns: ["rule", "type", "name", "severity", "line", "column"],
          });
          this.log("");
        }
      }
    }

    this.styledHeader(
      `Total: ${chalk.red(flatResults.length + " Results")} in ${chalk.yellow(
        scanResults.length + " Flows"
      )}.`
    );
    for (const sev of ["error", "warning", "note"]) {
      const cnt = this.errorCounters.get(sev) ?? 0;
      this.log(`- ${sev}: ${cnt}`);
    }
    this.log("");
  }

  // Convert flat results back to CLI's Violation format for backwards compatibility
  private convertToCliViolations(flatResults: any[]): any[] {
    return flatResults.map(r => ({
      flowName: r.flowName,
      flowApiName: r.flowFile.split('/').pop() ?? r.flowFile,
      flowUri: r.flowFile,
      rule: r.ruleName,
      severity: r.severity,
      type: r.type,
      name: r.name,
      lineNumber: r.lineNumber,
      columnNumber: r.columnNumber,
      metaType: r.metaType,
      details: r.details,
    }));
  }
}