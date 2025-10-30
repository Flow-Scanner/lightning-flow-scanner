import * as vscode from 'vscode';
import { SelectFlows } from '../libs/SelectFlows';
import { SaveFlow } from '../libs/SaveFlow';
import { ScanOverview } from '../panels/ScanOverviewPanel';
import * as core from 'lightning-flow-scanner-core';
import { findFlowCoverage } from '../libs/FindFlowCoverage';
import { CacheProvider } from '../providers/cache-provider';
import { OutputChannel } from '../providers/outputChannel';
import { ConfigProvider } from '../providers/config-provider';
import * as YAML from 'yaml';

const { USE_NEW_CONFIG: isUseNewConfig } = process.env;

export default class Commands {
  constructor(private context: vscode.ExtensionContext) { }

  
  get handlers() {
    const rawHandlers: Record<string, (...args: any[]) => any> = {
      'flowscanner.openDocumentation': () => this.openDocumentation(),
      'flowscanner.configRules': () => this.configRules(),
      'flowscanner.scanFlows': () => this.scanFlows(),
      'flowscanner.fixFlows': () => this.fixFlows(),
    };

    return Object.entries(rawHandlers).map(([command, handler]) => {
      return [
        command,
        async (...args: any[]): Promise<any> => {
          return handler(...args);
        }
      ] as const;
    });
  }

  private openDocumentation() {
    const url = vscode.Uri.parse('https://github.com/Flow-Scanner/lightning-flow-scanner-core?tab=readme-ov-file#default-rules');
    vscode.env.openExternal(url);
  }

private async configRules() {
  type RuleWithExpression = { severity: string; expression?: string };
  type RuleConfig = Record<string, RuleWithExpression>;

  // If new YAML config flow is enabled
  if (isUseNewConfig === 'true') {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const configProvider = new ConfigProvider();

    try {
      const configResult = await configProvider.discover(workspacePath);

      // Type assertion for safe access
      const configTyped = configResult.config as { rules?: RuleConfig } | undefined;
      const rules: RuleConfig = configTyped?.rules ?? {};

      // Prompt for missing expressions
      if (!rules.FlowName?.expression) {
        const naming = await vscode.window.showInputBox({
          prompt: 'Define a naming convention for Flow Names (REGEX format).',
          placeHolder: '[A-Za-z0-9]+_[A-Za-z0-9]+',
          value: '[A-Za-z0-9]+_[A-Za-z0-9]+',
        });
        if (naming) rules.FlowName = { severity: 'error', expression: naming };
      }

      if (!rules.APIVersion?.expression) {
        const apiVersion = await vscode.window.showInputBox({
          prompt: 'Set an API Version rule (e.g. ">50" or ">=60").',
          placeHolder: '>50',
          value: '>50',
        });
        if (apiVersion) rules.APIVersion = { severity: 'error', expression: apiVersion };
      }

      // Persist updated YAML config using yaml.stringify
      const yamlString = YAML.stringify(configResult.config);
      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(configResult.fspath),
        new TextEncoder().encode(yamlString)
      );

      // Store rules in cache
      await CacheProvider.instance.set('ruleconfig', rules);
      OutputChannel.getInstance().logChannel.debug('Stored YAML rule config', rules);

      // Open config file in editor
      const document = await vscode.workspace.openTextDocument(configResult.fspath);
      await vscode.window.showTextDocument(document);
      vscode.window.showInformationMessage(`Loaded configuration from ${configResult.fspath}`);
      return;
    } catch (err: any) {
      vscode.window.showErrorMessage(`Error loading configuration: ${err?.message || err}`);
      return;
    }
  }

  // ----- Legacy QuickPick flow -----
  const allRules: core.IRuleDefinition[] = [...core.getRules()];
  const ruleConfig: RuleConfig = {};

  const items = allRules.map((rule) => ({
    label: rule.label,
    value: rule.name,
    picked: true,
  }));

  const selectedRules = (await vscode.window.showQuickPick(items, {
    canPickMany: true,
  })) as { label: string; value: string }[];

  if (!selectedRules) {
    vscode.window.showInformationMessage('No rules selected.');
    return;
  }

  for (const rule of allRules) {
    if (selectedRules.map((r) => r.value).includes(rule.name)) {
      ruleConfig[rule.name] = { severity: 'error' };
    }
  }

  // Prompt for FlowName expression if selected
  if (selectedRules.some((r) => r.value === 'FlowName')) {
    const naming = await vscode.window.showInputBox({
      prompt: 'Define a naming convention for Flow Names (REGEX format).',
      placeHolder: '[A-Za-z0-9]+_[A-Za-z0-9]+',
      value: '[A-Za-z0-9]+_[A-Za-z0-9]+',
    });
    if (naming) {
      ruleConfig['FlowName'] = { severity: 'error', expression: naming };
      await vscode.workspace
        .getConfiguration()
        .update('flowscanner.NamingConvention', naming, true);
    }
  }

  // Prompt for APIVersion expression if selected
  if (selectedRules.some((r) => r.value === 'APIVersion')) {
    const apiVersion = await vscode.window.showInputBox({
      prompt: 'Set an API Version rule (e.g. ">50" or ">=60").',
      placeHolder: '>50',
      value: '>50',
    });
    if (apiVersion) {
      ruleConfig['APIVersion'] = { severity: 'error', expression: apiVersion };
      await vscode.workspace
        .getConfiguration()
        .update('flowscanner.APIVersion', apiVersion, true);
    }
  }

  // Store legacy rules in cache
  await CacheProvider.instance.set('ruleconfig', ruleConfig);
  OutputChannel.getInstance().logChannel.debug('Stored legacy rule config', ruleConfig);
}

  // debug view 
  // private async debugView() {
  //   let results = testdata as unknown as core.ScanResult[];
  //   await CacheProvider.instance.set('results', results);
  //   ScanOverview.createOrShow(this.context.extensionUri, results);
  //   await vscode.commands.executeCommand(
  //     'workbench.action.webview.openDeveloperTools'
  //   );
  // }

  private async scanFlows() {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri;
    const selectedUris = await new SelectFlows(
      rootPath,
      'Select a root folder:'
    ).execute(rootPath);
    OutputChannel.getInstance().logChannel.debug(
      'Selected uris',
      ...selectedUris
    );
    if (selectedUris.length > 0) {
      let results: core.ScanResult[] = [];
      const panel = ScanOverview.createOrShow(
        this.context.extensionUri,
        results
      );
      OutputChannel.getInstance().logChannel.trace('create panel');
      let configReset: vscode.WorkspaceConfiguration =
        vscode.workspace
          .getConfiguration('flowscanner')
          .get('Reset') ?? undefined;
      OutputChannel.getInstance().logChannel.trace(
        'load vscode stored configurations'
      );
      if (configReset) {
        OutputChannel.getInstance().logChannel.trace('reset configurations');
        await this.configRules();
      }
      let ruleConfig = CacheProvider.instance.get('ruleconfig');
      OutputChannel.getInstance().logChannel.debug(
        'load stored rule configurations',
        ruleConfig
      );
      if (isUseNewConfig === 'true') {
        // load and use config
        const configProvider = new ConfigProvider();
        ruleConfig = await configProvider.loadConfig(rootPath.fsPath);
      }
      results = core.scan(await core.parse(selectedUris), ruleConfig);
      OutputChannel.getInstance().logChannel.debug('Scan Results', ...results);
      await CacheProvider.instance.set('results', results);
      ScanOverview.createOrShow(this.context.extensionUri, results);
    } else {
      vscode.window.showInformationMessage('No flow files found.');
    }
  }

  private async fixFlows() {
    const storedResults = CacheProvider.instance.get('results');
    OutputChannel.getInstance().logChannel.trace(
      'has scan results?',
      storedResults.length
    );
    if (storedResults && storedResults.length > 0) {
      OutputChannel.getInstance().logChannel.debug(
        'contains scan results',
        ...storedResults
      );
      ScanOverview.createOrShow(this.context.extensionUri, []);
      const newResults: core.ScanResult[] = core.fix(storedResults);
      OutputChannel.getInstance().logChannel.debug(
        'invoked scanned results in total: ',
        newResults.length
      );
      for (const newResult of newResults) {
        OutputChannel.getInstance().logChannel.trace('Fixed File', newResult);
        const uri = vscode.Uri.file(newResult.flow.fsPath);
        await new SaveFlow().execute(newResult.flow, uri);
      }
      if (newResults && newResults.length > 0) {
        OutputChannel.getInstance().logChannel.trace(
          'Has fixed results, storing inside cache'
        );
        await CacheProvider.instance.set('results', newResults);
        await ScanOverview.createOrShow(this.context.extensionUri, newResults);
      } else {
        OutputChannel.getInstance().logChannel.trace(
          'Nothing fixed, showing warning message'
        );
        await ScanOverview.createOrShow(
          this.context.extensionUri,
          storedResults
        );
        await vscode.window.showWarningMessage(
          'Fix Flows: UnusedVariable and UnconnectedElement rules are currently supported, stay tuned for more rules.'
        );
      }
    }
  }
}