import {
  IRulesConfig,
  getRules,
  AdvancedRule,
} from 'lightning-flow-scanner-core';
import * as vscode from 'vscode';
import { Document, parse } from 'yaml';

type Configuration = {
  fspath: string;
  config: unknown;
};

export class ConfigProvider {
  public async discover(configPath: string): Promise<Configuration> {
    const configurationName = 'flow-scanner';

    const findInJson = [`.${configurationName}.json`, `${configurationName}.json`];
    const findInYml = [
      `.${configurationName}.yml`,
      `.${configurationName}.yaml`,
      `${configurationName}.yaml`,
      `${configurationName}.yml`,
      configurationName,
    ];

    // Try reading JSON then YAML
    let configFile =
      (await this.attemptToReadConfig(configPath, findInJson, JSON.parse)) ??
      (await this.attemptToReadConfig(configPath, findInYml, parse));

    const vscodeConfig = vscode.workspace.getConfiguration('lightningFlowScanner');

    if (!configFile) {
      // No file exists, create a new one with workspace settings applied
      configFile = await this.writeConfigFile(configurationName, configPath, vscodeConfig);
    } else {
      // Merge workspace settings into loaded config
      configFile.config = this.mergeWorkspaceSettings(configFile.config, vscodeConfig);

      // Persist updated config back to disk
      await this.persistConfig(configFile.fspath, configFile.config);
    }

    return configFile;
  }

  /**
   * Write a new default YAML configuration
   */
  private async writeConfigFile(
    configurationName: string,
    configPath: string,
    vscodeConfig: vscode.WorkspaceConfiguration
  ): Promise<Configuration> {
    const allRules = this.buildDefaultRules(vscodeConfig);
    const config = { rules: allRules };

    // Apply workspace settings (in case FlowName / APIVersion exist)
    const finalConfig = this.mergeWorkspaceSettings(config, vscodeConfig);

    const fspath = `${configPath}/.${configurationName}.yml`;
    await this.persistConfig(fspath, finalConfig);

    return { fspath, config: finalConfig };
  }

  /**
   * Build default rules map (legacy rule names only)
   */
  private buildDefaultRules(vscodeConfig: vscode.WorkspaceConfiguration) {
    return [...getRules()].reduce((acc, rule: AdvancedRule) => {
      acc[rule.name] = { severity: 'error' };

      // Workspace expressions applied
      if (rule.name === 'FlowName') {
        const namingConvention = vscodeConfig.get<string>('NamingConvention');
        if (namingConvention) acc[rule.name].expression = namingConvention;
      }

      if (rule.name === 'APIVersion') {
        const apiVersionExpr = vscodeConfig.get<string>('APIVersion');
        if (apiVersionExpr) acc[rule.name].expression = apiVersionExpr;
      }

      return acc;
    }, {} as Record<string, { severity: string; expression?: string }>);
  }

  /**
   * Merge VS Code workspace settings into a loaded config
   */
  private mergeWorkspaceSettings(config: any, vscodeConfig: vscode.WorkspaceConfiguration) {
    if (!config.rules) config.rules = {};

    const namingConvention = vscodeConfig.get<string>('NamingConvention');
    const apiVersionExpr = vscodeConfig.get<string>('APIVersion');

    if (namingConvention) {
      config.rules['FlowName'] = {
        ...(config.rules['FlowName'] || { severity: 'error' }),
        expression: namingConvention,
      };
    }

    if (apiVersionExpr) {
      config.rules['APIVersion'] = {
        ...(config.rules['APIVersion'] || { severity: 'error' }),
        expression: apiVersionExpr,
      };
    }

    return config;
  }

  /**
   * Persist a config object to disk as YAML
   */
  private async persistConfig(fspath: string, config: any) {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(fspath),
      new TextEncoder().encode(String(new Document(config)))
    );
  }

  /**
   * Attempt to read an existing config file from disk
   */
  private async attemptToReadConfig(
    basePath: string,
    potentialFileNames: string[],
    parser: Function
  ): Promise<Configuration | null> {
    for (const fileName of potentialFileNames) {
      const file = vscode.Uri.file(`${basePath}/${fileName}`);
      try {
        await vscode.workspace.fs.stat(file);
        const fileContent = Buffer.from(await vscode.workspace.fs.readFile(file)).toString();
        const config = parser(fileContent);
        return { fspath: file.fsPath, config };
      } catch {
        // file does not exist
      }
    }
    return null;
  }

  /**
   * Load normalized IRulesConfig
   */
  public async loadConfig(configPath?: string): Promise<IRulesConfig> {
    const explorerResults = await this.discover(configPath);
    return (explorerResults?.config as IRulesConfig) ?? {};
  }
}
