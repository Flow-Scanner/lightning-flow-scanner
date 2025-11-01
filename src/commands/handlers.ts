/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { SelectFlows } from '../libs/SelectFlows';
import { SaveFlow } from '../libs/SaveFlow';
import { ScanOverview } from '../panels/ScanOverviewPanel';
import * as core from 'lightning-flow-scanner-core';
import { CacheProvider } from '../providers/cache-provider';
import { OutputChannel } from '../providers/outputChannel';
import { loadScannerConfig } from '../providers/config-provider';
import * as path from 'path';

const toFsPaths = (uris: vscode.Uri[]): string[] => uris.map(u => u.fsPath);
const toUris = (paths: string[]): vscode.Uri[] => paths.map(p => vscode.Uri.file(p));

interface RuleEntry {
  severity: string;
  expression?: string;
}
type RuleConfig = Record<string, RuleEntry>;

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
      return [command, async (...args: any[]) => handler(...args)] as const;
    });
  }

  private openDocumentation() {
    const url = vscode.Uri.parse('https://github.com/Flow-Scanner/lightning-flow-scanner-core?tab=readme-ov-file#default-rules');
    vscode.env.openExternal(url);
  }

  private async loadConfig(workspacePath: string): Promise<RuleConfig> {
    const rawConfig = await loadScannerConfig(workspacePath);
    // OutputChannel.getInstance().logChannel.debug('Raw config loaded:', JSON.stringify(rawConfig, null, 2));

    const rawRules = (rawConfig.rules as Record<string, unknown>) || {};
    const rules: RuleConfig = {};

    for (const [name, rule] of Object.entries(rawRules)) {
      if (typeof rule === 'object' && rule !== null) {
        const r = rule as Record<string, unknown>;
        rules[name] = {
          severity: String(r.severity ?? 'error'),
          expression: r.expression !== undefined ? String(r.expression) : undefined
        };
      }
    }

    await CacheProvider.instance.set('ruleconfig', rules);
    return rules;
  }

  private async saveConfig(workspacePath: string, rules: RuleConfig) {
    const configPath = path.join(workspacePath, '.flow-scanner.yml');
    const config = { rules };
    const yamlLines = ['rules:'];
    for (const [name, rule] of Object.entries(config.rules)) {
      yamlLines.push(`  ${name}:`);  // 2 spaces
      yamlLines.push(`    severity: ${rule.severity}`);  // 4 spaces
      if (rule.expression) {
        yamlLines.push(`    expression: ${JSON.stringify(rule.expression)}`);  // 4 spaces
      }
    }
    const yamlString = yamlLines.join('\n');
    await vscode.workspace.fs.writeFile(vscode.Uri.file(configPath), new TextEncoder().encode(yamlString));
    await CacheProvider.instance.set('ruleconfig', rules);
  }

private async configRules() {
  const ws = vscode.workspace.workspaceFolders?.[0];
  if (!ws) {
    vscode.window.showErrorMessage('No workspace folder found.');
    return;
  }
  const workspacePath = ws.uri.fsPath;
  const configPath = path.join(workspacePath, '.flow-scanner.yml');
  
  // Check if config file exists and offer to open it
  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(configPath));
    // File exists - ask user what they want to do
    const choice = await vscode.window.showQuickPick(
      ['Open Config File', 'Reconfigure Rules'],
      { 
        placeHolder: 'Configuration file exists. What would you like to do?'
      }
    );
    
    if (choice === undefined) return;
    
    if (choice === 'Open Config File') {
      const doc = await vscode.workspace.openTextDocument(configPath);
      await vscode.window.showTextDocument(doc);
      return;
    }
    // Otherwise continue with reconfiguration
  } catch {
    // File doesn't exist, continue with normal flow
  }
  
  let rules: RuleConfig = await this.loadConfig(workspacePath);
  const allRules = [...core.getRules()];
  const currentNames = Object.keys(rules);
  
  // Preselect all rules if no config exists
  const isEmptyConfig = currentNames.length === 0;
  const items = allRules.map(rule => ({
    label: rule.label,
    description: rule.name,
    picked: isEmptyConfig ? true : currentNames.includes(rule.name),
  }));
  const selected = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: 'Select rules to enable/disable',
  });
  if (selected === undefined) return;
  const newRules: RuleConfig = {};
  for (const item of selected) {
    const def = allRules.find(r => r.name === item.description)!;
    const existing = rules[def.name];
    newRules[def.name] = {
      severity: existing?.severity || 'error',
      expression: existing?.expression,
    };
  }
  let changed = false;
  if (newRules.FlowName) {
    const current = newRules.FlowName.expression || '';
    const expr = await vscode.window.showInputBox({
      prompt: 'Define naming convention (REGEX) for FlowName',
      placeHolder: '[A-Za-z0-9]+_[A-Za-z0-9]+',
      value: current || '[A-Za-z0-9]+_[A-Za-z0-9]+',
    });
    if (expr !== undefined && expr.trim() !== current) {
      newRules.FlowName.expression = expr.trim() || undefined;
      changed = true;
    }
  }
  if (newRules.APIVersion) {
    const current = newRules.APIVersion.expression || '';
    const expr = await vscode.window.showInputBox({
      prompt: 'Set API version rule (e.g. ">=50")',
      placeHolder: '>=50',
      value: current || '>=50',
    });
    if (expr !== undefined && expr.trim() !== current) {
      newRules.APIVersion.expression = expr.trim() || undefined;
      changed = true;
    }
  }
  if (changed || Object.keys(newRules).length !== currentNames.length) {
    await this.saveConfig(workspacePath, newRules);
    
    // After saving, offer to open the file
    const openFile = await vscode.window.showInformationMessage(
      'Configuration saved successfully!',
      'Open Config File'
    );
    if (openFile) {
      const doc = await vscode.workspace.openTextDocument(configPath);
      await vscode.window.showTextDocument(doc);
    }
  }
}

  private async scanFlows() {
    const selectedUris = await this.selectFlows('Select flow files or folder to scan:');
    if (!selectedUris) return;

    const root = vscode.workspace.workspaceFolders![0].uri;
    ScanOverview.createOrShow(this.context.extensionUri, []);

    const configReset = vscode.workspace.getConfiguration('flowscanner').get<boolean>('Reset');
    if (configReset) await this.configRules();

    // Load config dynamically from YAML file
    const ruleConfig = await this.loadConfig(root.fsPath);

    if (Object.keys(ruleConfig).length === 0) {
      const choice = await vscode.window.showWarningMessage(
        'No rules configured. Run "Configure Rules" first?',
        'Configure Now',
        'Scan Anyway'
      );
      if (choice === 'Configure Now') {
        await this.configRules();
        return;
      }
    }

    OutputChannel.getInstance().logChannel.debug('Using rule config for scan:', ruleConfig);
    const scanConfig = { rules: ruleConfig };

    const parsed = await core.parse(toFsPaths(selectedUris));
    const results = core.scan(parsed, scanConfig);

    await CacheProvider.instance.set('results', results);
    ScanOverview.createOrShow(this.context.extensionUri, results);
  }

  private async fixFlows() {
    let results: core.ScanResult[] = CacheProvider.instance.get('results') || [];

    if (results.length > 0) {
      const use = await vscode.window.showQuickPick(
        ['Use last scan results', 'Select different files to fix'],
        { placeHolder: `Found ${results.length} scan result(s) from previous run` }
      );
      if (use === 'Select different files to fix') results = [];
      else if (use === undefined) return;
    }

    if (results.length === 0) {
      const uris = await this.selectFlows('Select flow files to fix:');
      if (!uris) return;

      const root = vscode.workspace.workspaceFolders![0].uri;
      const ruleConfig = await this.loadConfig(root.fsPath);

      if (Object.keys(ruleConfig).length === 0) {
        const choice = await vscode.window.showWarningMessage(
          'No rules configured. Run "Configure Rules" first?',
          'Configure Now',
          'Fix Anyway'
        );
        if (choice === 'Configure Now') {
          await this.configRules();
          return;
        }
      }

      const parsed = await core.parse(toFsPaths(uris));
      results = core.scan(parsed, ruleConfig);
    }

    if (results.length === 0) {
      vscode.window.showInformationMessage('No issues to fix.');
      ScanOverview.createOrShow(this.context.extensionUri, []);
      return;
    }

    ScanOverview.createOrShow(this.context.extensionUri, results);
    const fixed = core.fix(results);
    for (const r of fixed) {
      await new SaveFlow().execute(r.flow, vscode.Uri.file(r.flow.fsPath));
    }
    await CacheProvider.instance.set('results', fixed);
    ScanOverview.createOrShow(this.context.extensionUri, fixed.length ? fixed : results);
  }

  private async selectFlows(prompt: string): Promise<vscode.Uri[] | undefined> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (!root) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }
    const paths = await new SelectFlows(root, prompt).execute(root);
    if (!paths.length) {
      vscode.window.showInformationMessage('No flow files selected.');
      return;
    }
    return toUris(paths);
  }
}