import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages } from "@salesforce/core";
import chalk from "chalk";
import { loadScannerOptions } from "../../libs/ScannerConfig.js";
import { FindFlows } from "../../libs/FindFlows.js";
import { ScanResult as Output } from "../../models/ScanResult.js";
import pkg, {
  ParsedFlow,
  ScanResult,
  RuleResult,
  ResultDetails,
} from "@flow-scanner/lightning-flow-scanner-core";
import { inspect } from "util";

const {
  parse: parseFlows,
  scan: scanFlows,
} = pkg;

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages("lightning-flow-scanner", "command");

export default class Scan extends SfCommand<Output> {
  public static description = messages.getMessage("commandDescription");
  public static examples: string[] = [
    "sf flow scan",
    "sf flow scan --failon warning",
    "sf flow scan -c path/to/config.json",
    "sf flow scan -c path/to/config.json --json",
    "sf flow scan -c path/to/config.json --failon warning",
    "sf flow scan -d path/to/flows/directory",
    "sf flow scan --files path/to/single/file.flow-meta.xml path/to/another/file.flow-meta.xml",
    "sf flow scan -p path/to/single/file.flow-meta.xml path/to/another/file.flow-meta.xml",
  ];

  protected static requiresUsername = false;
  protected static supportsDevhubUsername = false;
  public static requiresProject = false;
  protected static supportsUsername = true;

  protected failOn = "error";
  protected errorCounters: Map<string, number> = new Map<string, number>();

  public static readonly flags = {
    directory: Flags.directory({
      char: "d",
      description: messages.getMessage("directoryToScan"),
      required: false,
      exists: true,
      exclusive: ["files"],
    }),
    config: Flags.file({
      char: "c",
      description: "Path to configuration file",
      required: false,
    }),
    failon: Flags.option({
      char: "f",
      description:
        "Threshold failure level (error, warning, note, or never) defining when the command return code will be 1",
      options: ["error", "warning", "note", "never"] as const,
      default: "error",
    })(),
    files: Flags.file({
      multiple: true,
      exists: true,
      description: "List of source flows paths to scan",
      charAliases: ["p"],
      exclusive: ["directory"],
    }),
    betamode: Flags.boolean({
      char: "z",
      description: "Enable beta rules at run-time (experimental)",
      default: false,
    }),
  };

  public async run(): Promise<Output> {
    const { flags } = await this.parse(Scan);
    this.failOn = flags.failon || "error";

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
    const tryScan = (): [ScanResult[], Error | null] => {
      try {
        const scanConfig: any = {
          rules: mergedConfig.rules ?? {},
          betamode: !!mergedConfig.betamode,
        };
        return [scanFlows(parsedFlows, scanConfig), null];
      } catch (err) {
        return [null, err as Error];
      }
    };
    const [scanResults, scanError] = tryScan();

    this.debug(`error:`, inspect(scanError));
    this.debug(`scan results: ${scanResults.length}`, ...scanResults);
    this.spinner.stop(`Scan complete`);

    // ---- 6. Build / display results -----------------------------------------
    const results = this.buildResults(scanResults);

    if (results.length > 0) {
      const resultsByFlow: Record<string, any[]> = {};
      for (const r of results) {
        resultsByFlow[r.flowName] = resultsByFlow[r.flowName] ?? [];
        resultsByFlow[r.flowName].push(r);
      }

      for (const flowName in resultsByFlow) {
        const match = scanResults.find((s) => s.flow.label === flowName)!;
        this.styledHeader(
          `Flow: ${chalk.yellow(flowName)} ${chalk.bgYellow(
            `(${match.flow.name}.flow-meta.xml)`
          )} ${chalk.red(`(${resultsByFlow[flowName].length} results)`)}`
        );
        this.log(chalk.italic("Type: " + match.flow.type));
        this.log("");
        this.table({
          data: resultsByFlow[flowName],
          columns: ["rule", "type", "name", "severity"],
        });
        this.debug(`Results By Flow: ${inspect(resultsByFlow[flowName])}`);
        this.log("");
      }
    }

    this.styledHeader(
      `Total: ${chalk.red(results.length + " Results")} in ${chalk.yellow(
        scanResults.length + " Flows"
      )}.`
    );

    for (const sev of ["error", "warning", "note"]) {
      const cnt = this.errorCounters.get(sev) ?? 0;
      this.log(`- ${sev}: ${cnt}`);
    }
    this.log("");

    // ---- 7. Exit code -------------------------------------------------------
    const status = this.getStatus();
    if (status > 0) process.exitCode = status;

    const summary = {
      flowsNumber: scanResults.length,
      results: results.length,
      message: `A total of ${results.length} results have been found in ${scanResults.length} flows.`,
      errorLevelsDetails: {},
    };

    return { summary, status, results };
  }

  private findFlows(directory?: string, sourcepath?: string[]) {
    if (directory) return FindFlows(directory);
    if (sourcepath?.length) return sourcepath;
    return FindFlows(".");
  }

  private getStatus() {
    if (this.failOn === "never") return 0;
    if (this.failOn === "error" && this.errorCounters.get("error")! > 0) return 1;
    if (
      this.failOn === "warning" &&
      (this.errorCounters.get("error")! > 0 || this.errorCounters.get("warning")! > 0)
    )
      return 1;
    if (
      this.failOn === "note" &&
      (this.errorCounters.get("error")! > 0 ||
        this.errorCounters.get("warning")! > 0 ||
        this.errorCounters.get("note")! > 0)
    )
      return 1;
    return 0;
  }

  private buildResults(scanResults: ScanResult[]) {
    const errors: any[] = [];

    for (const sr of scanResults) {
      const flowName = sr.flow.label;
      const flowType = sr.flow.type[0];

      for (const rule of sr.ruleResults as RuleResult[]) {
        if (!rule.occurs || !rule.details?.length) continue;

        const severity = rule.severity ?? "error";
        const flowUri = sr.flow.fsPath;
        const flowApiName = `${sr.flow.name}.flow-meta.xml`;

        for (const detail of rule.details as ResultDetails[]) {
          errors.push(
            Object.assign(detail, {
              ruleDescription: rule.ruleDefinition.description,
              rule: rule.ruleDefinition.label,
              flowName,
              flowType,
              severity,
              flowUri,
              flowApiName,
            })
          );
          this.errorCounters.set(severity, (this.errorCounters.get(severity) ?? 0) + 1);
        }
      }
    }
    return errors;
  }
}