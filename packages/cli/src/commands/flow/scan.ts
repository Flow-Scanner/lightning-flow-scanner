import * as path from "path";
import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages } from "@salesforce/core";
import chalk from "chalk";
import { loadScannerOptions } from "../../libs/ScannerConfig.js";
import { FindFlows } from "../../libs/FindFlows.js";
import { FileSystemResolver } from "../../libs/FileSystemResolver.js";
import { ScanResult as Output } from "../../models/ScanResult.js";
import pkg, {
  ParsedFlow,
  ScanResult,
  type SubflowResolver,
} from "@flow-scanner/lightning-flow-scanner-core";
import type { Threshold, RuleCategory } from "@flow-scanner/lightning-flow-scanner-core";
import { stringify as csvStringify } from "csv-stringify/sync";

const {
  parse: parseFlows,
  scan: scanFlows,
  exportSarif: exportSarif,
  flatten: flattenResults,
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
    "sf flow scan --categories problem",
    "sf flow scan --categories problem suggestion",
    "sf flow scan -g problem -g suggestion",
  ];
  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  public static requiresProject = false;
  protected static supportsUsername = true;
  protected threshold: Threshold = "never";
  protected static supportsRawOutput = true;
  protected flatResults: Array<{ severity?: string }> = [];

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
        "Filter results by minimum severity (error, warning, note, never). 'never' shows all results.",
      options: ["error", "warning", "note", "never"] as const,
    })(),
    failon: Flags.option({
      char: "f",
      description:
        "[DEPRECATED] Use --threshold (-t) instead.",
      options: ["error", "warning", "note", "never"] as const,
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
    betaMode: Flags.boolean({
      char: "z",
      description: "Enable beta rules at run-time (experimental)",
      default: false,
    }),
    categories: Flags.option({
      char: "g",
      description: "Filter rules by category (problem, suggestion, layout). Can specify multiple.",
      options: ["problem", "suggestion", "layout"] as const,
      multiple: true,
    })(),
  };

  public async run(): Promise<Output> {
    const { flags } = await this.parse(Scan);

    if (flags.failon && !flags.threshold) {
      this.warn("--failon is deprecated. Use --threshold (-t) instead.");
    }

    this.spinner.start("Loading Lightning Flow Scanner");

    // ---- 1. Determine search directory for config -------------------------
    const searchDirectory = flags.directory ?? (flags.files && flags.files.length > 0 ? flags.files[0] : ".");

    // ---- 2. Load config file -------------------------------------------------
    const fileConfig = await loadScannerOptions(flags.config, {}, searchDirectory);

    // ---- 3. Merge CLI overrides (betaMode, categories, threshold) -----------
    // CLI flags take precedence over file config
    const mergedConfig = {
      ...fileConfig,
      betaMode: flags.betaMode ?? fileConfig.betaMode ?? false,
      categories: flags.categories ?? fileConfig.categories,
      threshold: flags.threshold ?? flags.failon ?? fileConfig.threshold ?? "never",
    };
    this.threshold = mergedConfig.threshold as Threshold;

    // ---- 4. Locate flows ----------------------------------------------------
    const flowFiles = this.findFlows(flags.directory, flags.files, mergedConfig.ignore);
    this.spinner.start(`Identified ${flowFiles.length} flows to scan`);

    // ---- 4. Parse flows ------------------------------------------------------
    const parsedFlows: ParsedFlow[] = await parseFlows(flowFiles);
    this.debug(`parsed flows ${parsedFlows.length}`, ...parsedFlows);

    // ---- 4b. Build a subflow resolver for cross-flow analysis ----------------
    // Rules that traverse into referenced subflows (e.g. DML-in-loop across
    // subflows, unresolved-subflow) resolve synchronously during check(), so the
    // resolver is eager-loaded up front. Failure to build it must never fail the
    // scan; affected rules simply skip cross-flow analysis.
    const subflowResolver = await this.buildSubflowResolver(
      flags.directory,
      flowFiles,
      mergedConfig.ignore
    );

    // ---- 5. Run the scan (threshold filtering happens in core) ---------------
    let scanResults: ScanResult[];
    try {
      const scanConfig = {
        rules: mergedConfig.rules ?? {},
        betaMode: !!mergedConfig.betaMode,
        categories: mergedConfig.categories as RuleCategory[] | undefined,
        threshold: this.threshold,
        ignoreFlows: mergedConfig.ignoreFlows,
        exceptions: mergedConfig.exceptions,
        subflowResolver,
      };
      scanResults = scanFlows(parsedFlows, scanConfig);
    } catch (err) {
      this.error(`Scan failed: ${(err as Error).message}`);
    }
    this.debug("Does every scanResult have fsPath?", scanResults.some(r => !r.flow?.fsPath));
    // ---- 6. Flatten to one self-contained record per violation --------------
    const flatResults = flattenResults(scanResults);
    this.flatResults = flatResults;

    // ---- 8. Handle output formats -------------------------------------------
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

    const summary = {
      flowsNumber: scanResults.length,
      results: flatResults.length,
      message: `A total of ${flatResults.length} results have been found in ${scanResults.length} flows.`,
    };

    return { summary, status: 0, results: this.convertToCliViolations(flatResults) };
  }

  private async buildSubflowResolver(
    directory: string | undefined,
    flowFiles: string[],
    ignore?: string[]
  ): Promise<SubflowResolver | undefined> {
    // Search the scanned directory, or the set of directories the located flow
    // files live in, so referenced sibling subflows can be resolved.
    const searchPaths = directory
      ? [directory]
      : Array.from(new Set(flowFiles.map((f) => path.dirname(f))));
    if (searchPaths.length === 0) return undefined;
    try {
      return await FileSystemResolver.create({
        searchPaths,
        ignorePatterns: ignore,
        eager: true, // pre-load so rules can resolve subflows synchronously
      });
    } catch (err) {
      this.debug(`Subflow resolver init failed: ${(err as Error).message}`);
      return undefined;
    }
  }

  private findFlows(directory?: string, sourcepath?: string[], configIgnore?: string[]) {
    if (directory) return FindFlows(directory, configIgnore);
    if (sourcepath?.length) return sourcepath;
    return FindFlows(".", configIgnore);
  }

  private countBySeverity(severity: string): number {
    return this.flatResults.filter(r => (r.severity ?? "warning") === severity).length;
  }

  private generateCSV(flatResults: any[]): string {
    if (flatResults.length === 0) {
      return "No violations found";
    }

    const columns = [
      "flowFile",
      "flowName",
      "ruleId",
      "ruleName",
      "severity",
      "message",
      "messageUrl",
      "type",
      "name",
      "lineNumber",
      "columnNumber",
      "metaType",
      "dataType",
      "locationX",
      "locationY",
      "connectsTo",
      "expression",
      "description",
      "referencedFlow",
      "referencedElement",
      "referencedType",
      "callChain",
      "taintedVariables",
      "sinkType",
    ];

    const records = flatResults.map(r => ({
      flowFile: r.flowFile ?? "",
      flowName: r.flowName ?? "",
      ruleId: r.ruleId ?? "",
      ruleName: r.ruleName ?? "",
      severity: r.severity ?? "warning",
      message: r.message ?? "",
      messageUrl: r.messageUrl ?? "",
      type: r.type ?? "",
      name: r.name ?? "",
      lineNumber: r.lineNumber ?? "",
      columnNumber: r.columnNumber ?? "",
      metaType: r.metaType ?? "",
      dataType: r.dataType ?? "",
      locationX: r.locationX ?? "",
      locationY: r.locationY ?? "",
      connectsTo: (r.connectsTo ?? []).join(", "),
      expression: r.expression ?? "",
      description: r.description ?? "",
      referencedFlow: r.referencedFlow ?? "",
      referencedElement: r.referencedElement ?? "",
      referencedType: r.referencedType ?? "",
      callChain: (r.callChain ?? []).join(" -> "),
      taintedVariables: (r.taintedVariables ?? []).join(", "),
      sinkType: r.sinkType ?? "",
    }));

    return csvStringify(records, {
      header: true,
      columns: columns,
    });
  }

  private displayHumanReadable(flatResults: any[], scanResults: ScanResult[]) {
    if (flatResults.length > 0) {
      const resultsByFlow: Record<string, any[]> = {};

      // Group results by flow
      for (const r of flatResults) {
        resultsByFlow[r.flowName] = resultsByFlow[r.flowName] ?? [];

        resultsByFlow[r.flowName].push({
          rule: r.ruleId,
          severity: r.severity,
          type: r.type,
          name: r.name,
          line: r.lineNumber,
          column: r.columnNumber,
          message: r.message || '',
          url: r.messageUrl || '',
        });
      }

      for (const flowName in resultsByFlow) {
        const match = scanResults.find((s) => s.flow.name === flowName);
        if (match) {

          this.styledHeader(
            `Flow: ${chalk.yellow(match.flow.label || flowName)} ${chalk.bgYellow(
              `(${match.flow.name}.flow-meta.xml)`
            )} ${chalk.red(`(${resultsByFlow[flowName].length} results)`)}`
          );
          this.log(chalk.italic("Type: " + match.flow.type));
          this.log("");

          this.table({
            data: resultsByFlow[flowName],
            columns: ["rule", "severity", "type", "name", "line", "column", "message", "url"],
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
      const cnt = this.countBySeverity(sev);
      this.log(`- ${sev}: ${cnt}`);
    }
    this.log("");
  }

  private convertToCliViolations(flatResults: any[]): any[] {
    return flatResults.map(r => ({
      flowName: r.flowName,
      flowApiName: r.flowFile.split('/').pop() ?? r.flowFile,
      flowUri: r.flowFile,
      ruleId: r.ruleId,
      ruleName: r.ruleName,
      severity: r.severity,
      type: r.type,
      name: r.name,
      lineNumber: r.lineNumber,
      columnNumber: r.columnNumber,
      metaType: r.metaType,
      dataType: r.dataType,
      locationX: r.locationX,
      locationY: r.locationY,
      connectsTo: r.connectsTo,
      expression: r.expression,
      description: r.description,
      referencedFlow: r.referencedFlow,
      referencedElement: r.referencedElement,
      referencedType: r.referencedType,
      callChain: r.callChain,
      taintedVariables: r.taintedVariables,
      sinkType: r.sinkType,
    }));
  }
}