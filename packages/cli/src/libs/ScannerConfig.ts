// scannerconfig.ts
import { cosmiconfig } from "cosmiconfig";

export interface ScannerOptions {
  rules?: Record<string, any>;
  exceptions?: Record<string, any>;
  betamode?: boolean;
  [key: string]: any;
}

export async function loadScannerOptions(
  forcedConfigFile?: string,
  cliOverrides: Partial<ScannerOptions> = {}
): Promise<ScannerOptions> {
  const moduleName = "flow-scanner";
  const searchPlaces = [
    "package.json",
    `.${moduleName}.yaml`,
    `.${moduleName}.yml`,
    `.${moduleName}.json`,
    `config/.${moduleName}.yaml`,
    `config/.${moduleName}.yml`,
    `.flow-scanner`,
  ];

  const explorer = cosmiconfig(moduleName, { searchPlaces });
  const result = forcedConfigFile
    ? await explorer.load(forcedConfigFile)
    : await explorer.search();

  const fileConfig: ScannerOptions = result?.config ?? {};

  return {
    ...fileConfig,
    ...cliOverrides,
    betamode: cliOverrides.betamode ?? fileConfig.betamode ?? false,
  };
}