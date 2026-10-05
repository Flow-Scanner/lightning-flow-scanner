/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { SelectFlows } from '../libs/SelectFlows';
import { ScanOverview } from '../panels/ScanOverviewPanel';
import * as core from '@flow-scanner/lightning-flow-scanner-core';
import { FileSystemResolver } from '../libs/FileSystemResolver';
import { CacheProvider } from '../providers/cache-provider';
import { OutputChannel } from '../providers/outputChannel';
import { loadScannerConfig } from '../providers/config-provider';
import * as path from 'path';

const toFsPaths = (uris: vscode.Uri[]): string[] => uris.map(u => u.fsPath);
const toUris = (paths: string[]): vscode.Uri[] => paths.map(p => vscode.Uri.file(p));

/**
 * Build a subflow resolver over the workspace so cross-flow rules can analyze
 * referenced subflows. Prefers the open workspace folders; falls back to the
 * directories of the scanned files. Never throws — cross-flow analysis simply
 * degrades to single-flow if the resolver cannot be built.
 */
async function buildWorkspaceResolver(
  fsPaths: string[]
): Promise<core.SubflowResolver | undefined> {
  try {
    const searchPaths =
      vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) ??
      Array.from(new Set(fsPaths.map((p) => path.dirname(p))));
    if (searchPaths.length === 0) return undefined;
    return await FileSystemResolver.create({ searchPaths, eager: true });
  } catch (e) {
    OutputChannel.getInstance().logChannel.debug('Subflow resolver init failed', e);
    return undefined;
  }
}

type Severity = "error" | "warning" | "note";

interface RuleEntry {
  severity: Severity;
  enabled?: boolean;
  [optionName: string]: unknown;
}

function normalizeSeverity(s: unknown): Severity {
  if (s === "error" || s === "warning" || s === "note") return s;
  return "warning"; // default
}

type RuleConfig = Record<string, RuleEntry>;

export default class Commands {
  constructor(private context: vscode.ExtensionContext) { }

  get handlers() {
    const rawHandlers: Record<string, (...args: any[]) => any> = {
      'flowscanner.openDocumentation': () => this.openDocumentation(),
      'flowscanner.configRules': () => this.configRules(),
      'flowscanner.scanFlows': (options?: any) => this.scanFlows(options),
      'flowscanner.generateFlowDocs': (options?: any) => this.generateFlowDocs(options),
      'flowscanner.fixFlows': () => this.fixFlows(),
    };
    return Object.entries(rawHandlers).map(([command, handler]) => {
      return [command, async (...args: any[]) => handler(...args)] as const;
    });
  }

  private openDocumentation() {
    const url = vscode.Uri.parse('https://github.com/Flow-Scanner/lightning-flow-scanner?tab=readme-ov-file#default-rules');
    vscode.env.openExternal(url);
  }

  private async loadConfig(workspacePath: string): Promise<{
    rules: RuleConfig;
    betamode: boolean;
    ruleMode: "merged" | "isolated";
    ignore?: string[];
    ignoreFlows?: string[];
    exceptions?: Record<string, Record<string, string[]>>;
    threshold?: 'error' | 'warning' | 'note' | 'never';
    categories?: ('problem' | 'suggestion' | 'layout')[];
  }> {
    const rawConfig = await loadScannerConfig(workspacePath);
    // OutputChannel.getInstance().logChannel.debug('Raw config loaded:', JSON.stringify(rawConfig, null, 2));
    const rawRules = (rawConfig.rules as Record<string, unknown>) || {};
    const rules: RuleConfig = {};
    for (const [name, rule] of Object.entries(rawRules)) {
      if (typeof rule === 'object' && rule !== null) {
        const r = rule as Record<string, unknown>;
        rules[name] = {
          ...r,
          severity: normalizeSeverity(r.severity),
          enabled: r.enabled !== undefined ? !!r.enabled : undefined
        };
      }
    }
    const betamode = !!rawConfig.betamode;
    const ruleMode: "merged" | "isolated" = String(rawConfig.ruleMode ?? 'merged').toLowerCase() === 'isolated' ? 'isolated' : 'merged';
    const ignore = Array.isArray(rawConfig.ignore) ? rawConfig.ignore as string[] : undefined;
    const ignoreFlows = Array.isArray(rawConfig.ignoreFlows) ? rawConfig.ignoreFlows as string[] : undefined;
    const exceptions = rawConfig.exceptions as Record<string, Record<string, string[]>> | undefined;

    // Load threshold from config (validate it's a valid value)
    const validThresholds = ['error', 'warning', 'note', 'never'];
    const threshold = validThresholds.includes(rawConfig.threshold) ? rawConfig.threshold as 'error' | 'warning' | 'note' | 'never' : undefined;

    // Load categories from config (validate they're valid values)
    const validCategories = ['problem', 'suggestion', 'layout'];
    const categories = Array.isArray(rawConfig.categories)
      ? (rawConfig.categories as string[]).filter(c => validCategories.includes(c)) as ('problem' | 'suggestion' | 'layout')[]
      : undefined;

    await CacheProvider.instance.set('ruleconfig', { rules, betamode, ruleMode });
    return { rules, betamode, ruleMode, ignore, ignoreFlows, exceptions, threshold, categories };
  }

  private async saveConfig(workspacePath: string, rules: RuleConfig, betamode: boolean, ruleMode: "merged" | "isolated") {
    const configPath = path.join(workspacePath, '.flow-scanner.yml');
    const yamlLines: string[] = [];
    if (ruleMode !== 'merged') {
      yamlLines.push(`ruleMode: ${ruleMode}`);
    }
    if (betamode) {
      yamlLines.push('betamode: true');
    }
    if (Object.keys(rules).length > 0) {
      yamlLines.push('rules:');
      for (const [ruleId, entry] of Object.entries(rules)) {
        yamlLines.push(`  ${ruleId}:`); // 2 spaces - now uses ruleId as key
        if (entry.enabled !== undefined) {
          yamlLines.push(`    enabled: ${entry.enabled}`); // 4 spaces
        }
        yamlLines.push(`    severity: ${entry.severity}`); // 4 spaces
        for (const [optionName, optionValue] of Object.entries(entry)) {
          if (optionName === 'enabled' || optionName === 'severity' || optionValue === undefined) continue;
          yamlLines.push(`    ${optionName}: ${JSON.stringify(optionValue)}`); // 4 spaces
        }
      }
    }
    const yamlString = yamlLines.join('\n');
    await vscode.workspace.fs.writeFile(vscode.Uri.file(configPath), new TextEncoder().encode(yamlString));
    await CacheProvider.instance.set('ruleconfig', { rules, betamode, ruleMode });
  }

  private async configRules(): Promise<boolean> {
    const ws = vscode.workspace.workspaceFolders?.[0];
    if (!ws) {
      vscode.window.showErrorMessage('No workspace folder found.');
      return false;
    }
    const workspacePath = ws.uri.fsPath;
    const configPath = path.join(workspacePath, '.flow-scanner.yml');

    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(configPath));
      const choice = await vscode.window.showQuickPick(
        ['Open Config File', 'Reconfigure Rules'],
        { placeHolder: 'Configuration file exists. What would you like to do?' }
      );
      if (choice === undefined) return false;
      if (choice === 'Open Config File') {
        const doc = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(doc);
        return false;
      }
    } catch {
      // file doesn't exist, continue
    }

    const config = await this.loadConfig(workspacePath);
    let rules = config.rules;
    let currentBetamode = config.betamode;
    let currentRuleMode = config.ruleMode;

    const modeOptions = currentRuleMode === 'merged'
      ? ['Merged (run all, override selected)', 'Isolated (run only selected)']
      : ['Isolated (run only selected)', 'Merged (run all, override selected)'];

    const modeChoice = await vscode.window.showQuickPick(modeOptions, { placeHolder: 'Select rule mode' });
    if (modeChoice === undefined) return false;

    const ruleMode: "merged" | "isolated" = modeChoice.startsWith('Merged') ? 'merged' : 'isolated';
    const betaOptions = currentBetamode ? ['Yes', 'No'] : ['No', 'Yes'];
    const includeBeta = await vscode.window.showQuickPick(betaOptions, { placeHolder: 'Do you want to opt-in for beta rules?' });
    if (includeBeta === undefined) return false;
    const betamode = includeBeta === 'Yes';

    const allRules = core.getRules(undefined, { betaMode: betamode });
    const currentNames = Object.keys(rules);
    const isEmptyConfig = currentNames.length === 0;
    const getExistingRuleConfig = (rule: core.IRuleDefinition): RuleEntry | undefined =>
      rules[rule.ruleId] ?? rules[rule.name];

    const items = allRules.map(rule => ({
      label: rule.label,
      description: rule.ruleId,
      picked: isEmptyConfig ? true : (getExistingRuleConfig(rule)?.enabled ?? true),
    }));

    const selected = await vscode.window.showQuickPick(items, { canPickMany: true, placeHolder: 'Select rules to enable/disable' });
    if (selected === undefined) return false;

    const selectedNames = new Set(selected.map(s => s.description!));
    const newRules: RuleConfig = {};

    if (ruleMode === 'isolated') {
      for (const item of selected) {
        const def = allRules.find(r => r.ruleId === item.description)!;
        const existing = getExistingRuleConfig(def);
        const severity = normalizeSeverity(existing?.severity ?? def.severity ?? 'warning');
        newRules[def.ruleId] = { ...existing, severity };
        delete newRules[def.ruleId].enabled;
      }
    } else {
      for (const def of allRules) {
        const ruleId = def.ruleId;
        const isSelected = selectedNames.has(ruleId);
        const ruleConfig = getExistingRuleConfig(def);
        const severity = normalizeSeverity(ruleConfig?.severity ?? def.severity ?? 'warning');
        const enabled = isSelected;
        const hasCustomSeverity = severity !== normalizeSeverity(def.severity ?? 'warning');
        const hasCustomOptions = Object.keys(ruleConfig ?? {}).some(key => key !== 'severity' && key !== 'enabled');
        const hasCustomEnabled = !enabled;

        if (hasCustomSeverity || hasCustomOptions || hasCustomEnabled) {
          newRules[ruleId] = { ...ruleConfig, severity };
          if (hasCustomEnabled) newRules[ruleId].enabled = enabled;
          else delete newRules[ruleId].enabled;
        }
      }
    }

    let changed = false;

    for (const def of allRules.filter(rule => selectedNames.has(rule.ruleId))) {
      for (const option of def.configurableOptions ?? []) {
        const existing = getExistingRuleConfig(def);
        const storedValue = newRules[def.ruleId]?.[option.name] ?? existing?.[option.name];
        const displayedValue = storedValue ?? option.defaultValue;
        let configuredValue: string | number | boolean | undefined;
        let accepted = false;

        if (option.type === 'boolean') {
          const choices = displayedValue === true ? ['Yes', 'No'] : ['No', 'Yes'];
          const choice = await vscode.window.showQuickPick(choices, {
            placeHolder: `${def.label}: ${option.description}`,
          });
          if (choice !== undefined) {
            accepted = true;
            configuredValue = choice === 'Yes';
          }
        } else {
          const value = await vscode.window.showInputBox({
            prompt: `${def.label}: ${option.description}`,
            placeHolder: option.defaultValue === undefined ? undefined : String(option.defaultValue),
            value: displayedValue === undefined ? '' : String(displayedValue),
            validateInput: option.type === 'number'
              ? input => input.trim() !== '' && Number.isFinite(Number(input)) ? undefined : 'Enter a valid number'
              : undefined,
          });
          if (value !== undefined) {
            accepted = true;
            configuredValue = option.type === 'number' ? Number(value) : (value.trim() || undefined);
          }
        }

        if (accepted && configuredValue !== storedValue) {
          if (!newRules[def.ruleId]) {
            newRules[def.ruleId] = {
              ...existing,
              severity: normalizeSeverity(existing?.severity ?? def.severity ?? 'warning'),
            };
          }
          if (configuredValue === undefined) delete newRules[def.ruleId][option.name];
          else newRules[def.ruleId][option.name] = configuredValue;
          changed = true;
        }
      }
    }

    if (changed || Object.keys(newRules).length !== currentNames.length || betamode !== currentBetamode || ruleMode !== currentRuleMode) {
      await this.saveConfig(workspacePath, newRules, betamode, ruleMode);
      vscode.window.showInformationMessage('Configuration saved successfully!');
      return true;
    }

    return false;
  }

  private async scanFlows(options?: {
    ruleMode?: 'merged' | 'isolated';
    betaMode?: boolean;
    threshold?: 'error' | 'warning' | 'note' | 'never';
    categories?: ('problem' | 'suggestion' | 'layout')[];
    overrideConfig?: boolean;
  }) {
    const root = vscode.workspace.workspaceFolders![0].uri;

    const configReset = vscode.workspace.getConfiguration('flowscanner').get('Reset');
    if (configReset) await this.configRules();

    // Load config dynamically from YAML file BEFORE selecting flows
    let config = await this.loadConfig(root.fsPath);

    const selectedUris = await this.selectFlows('Select flow files or folder to scan:', config.ignore);
    if (!selectedUris) return;

    // Start with config file values, then apply sidebar overwrites if enabled
    let effectiveThreshold: 'error' | 'warning' | 'note' | 'never' | undefined = config.threshold;
    let effectiveCategories: ('problem' | 'suggestion' | 'layout')[] | undefined = config.categories;

    if (options?.overrideConfig) {
      OutputChannel.getInstance().logChannel.debug('Applying sidebar scan options:', options);

      if (options.ruleMode !== undefined) {
        config.ruleMode = options.ruleMode;
      }

      if (options.betaMode !== undefined) {
        config.betamode = options.betaMode;
      }

      // Sidebar threshold overrides config if not 'never' (the default/unset value)
      if (options.threshold !== undefined && options.threshold !== 'never') {
        effectiveThreshold = options.threshold;
      }

      // Sidebar categories override config if not empty (the default/unset value)
      if (options.categories !== undefined && options.categories.length > 0) {
        effectiveCategories = options.categories;
      }
    }

    if (Object.keys(config.rules).length === 0) {
      const choice = await vscode.window.showWarningMessage(
        'No rules configured. Run "Configure Rules" first?',
        'Configure Now',
        'Scan Anyway'
      );

      if (choice === 'Configure Now') {
        const configured = await this.configRules();

        if (!configured) {
          return;
        }

        // RELOAD config after configuration
        config = await this.loadConfig(root.fsPath);

        // Re-apply effective values from reloaded config, then sidebar overwrites
        effectiveThreshold = config.threshold;
        effectiveCategories = config.categories;

        if (options?.overrideConfig) {
          if (options.ruleMode !== undefined) {
            config.ruleMode = options.ruleMode;
          }
          if (options.betaMode !== undefined) {
            config.betamode = options.betaMode;
          }
          if (options.threshold !== undefined && options.threshold !== 'never') {
            effectiveThreshold = options.threshold;
          }
          if (options.categories !== undefined && options.categories.length > 0) {
            effectiveCategories = options.categories;
          }
        }

        if (Object.keys(config.rules).length === 0) {
          vscode.window.showWarningMessage('No rules configured. Scan cancelled.');
          return;
        }
      } else if (!choice) {
        return;
      }
    }

    // Show panel with loading state
    ScanOverview.createOrShow(this.context.extensionUri, []);

    OutputChannel.getInstance().logChannel.debug('Using rule config for scan:', config);
    const fsPaths = toFsPaths(selectedUris);
    const parsed = await core.parse(fsPaths);
    const scanConfig = {
      rules: config.rules,
      betamode: config.betamode,
      ruleMode: config.ruleMode,
      ignoreFlows: config.ignoreFlows,
      exceptions: config.exceptions,
      categories: effectiveCategories,
      threshold: effectiveThreshold,
      subflowResolver: await buildWorkspaceResolver(fsPaths),
    };
    const results = core.scan(parsed, scanConfig);

    await CacheProvider.instance.set('results', results);
    ScanOverview.createOrShow(this.context.extensionUri, results);
  }

  private async generateFlowDocs(options?: {
    mode?: 'combined' | 'separate';
    includeDetails?: boolean;
    collapsedDetails?: boolean;
    outputDir?: string;
    configuredViaSidebar?: boolean;
  }) {
    const root = vscode.workspace.workspaceFolders![0].uri;
    const config = await this.loadConfig(root.fsPath);
    const selectedUris = await this.selectFlows('Select flow files or folder to document:', config.ignore);
    if (!selectedUris) return;

    // Use provided options or prompt for them
    let mode = options?.mode;
    let includeDetails = options?.includeDetails;
    let collapsedDetails = options?.collapsedDetails;

    // If not provided, prompt user
    const interactive = !options?.configuredViaSidebar;

    // Prompt ONLY if interactive
    if (!mode && interactive) {
      const modeChoice = await vscode.window.showQuickPick(
        [
          { label: '📄 Single Combined Document', value: 'combined' as const },
          { label: '📚 Separate Document Per Flow', value: 'separate' as const }
        ],
        { placeHolder: 'How would you like to generate documentation?' }
      );
      if (!modeChoice) return;
      mode = modeChoice.value;
    }

    // Apply defaults if non-interactive
    mode ??= 'combined';

    if (includeDetails === undefined && interactive) {
      const detailsChoice = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Include detailed node information?'
      });
      if (detailsChoice === undefined) return;
      includeDetails = detailsChoice === 'Yes';
    }
    includeDetails ??= true;

    if (collapsedDetails === undefined && includeDetails && interactive) {
      const collapsedChoice = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Collapse details by default?'
      });
      if (collapsedChoice === undefined) return;
      collapsedDetails = collapsedChoice === 'Yes';
    }
    collapsedDetails ??= true;

    // Rest of the implementation stays the same
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating flow documentation...",
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0, message: "Parsing flows..." });

        const parsed = await core.parse(toFsPaths(selectedUris));
        const validFlows = parsed.filter(p => p.flow);

        if (validFlows.length === 0) {
          vscode.window.showErrorMessage('No valid flows found to document.');
          return;
        }

        progress.report({ increment: 50, message: `Generating documentation for ${validFlows.length} flow(s)...` });

        const docOptions = {
          includeDetails: includeDetails ?? true,
          includeMarkdownDocs: true,
          collapsedDetails: collapsedDetails ?? true,
        };

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage('No workspace folder found.');
          return;
        }

        // ✅ Default to /docs/flow-docs
        const defaultDir = path.join(
          workspaceFolder.uri.fsPath,
          'docs',
          'flow-docs'
        );

        const outputDir = options?.outputDir || defaultDir;

        // ✅ Creates /docs and /docs/flow-docs if missing
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(outputDir));

        if (mode === 'combined') {
          const markdown = core.exportDiagram(parsed, docOptions);
          const fileName = `Flow_Documentation_${Date.now()}.md`;
          const outputFile = vscode.Uri.file(path.join(outputDir, fileName));

          await vscode.workspace.fs.writeFile(outputFile, new TextEncoder().encode(markdown));
          progress.report({ increment: 100 });

          const doc = await vscode.workspace.openTextDocument(outputFile);
          await vscode.window.showTextDocument(doc, { preview: false });
          await vscode.commands.executeCommand('markdown.showPreview', outputFile);

          vscode.window.showInformationMessage(
            `✅ Documentation generated for ${validFlows.length} flow(s)`,
            'Open File'
          ).then(choice => {
            if (choice === 'Open File') {
              vscode.commands.executeCommand('revealFileInOS', outputFile);
            }
          });
        } else {
          const generatedFiles: vscode.Uri[] = [];

          for (let i = 0; i < validFlows.length; i++) {
            const pf = validFlows[i];
            const singleParsed = [pf];
            const markdown = core.exportDiagram(singleParsed, docOptions);

            const safeName = pf.flow!.name.replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `${safeName}.md`;
            const outputFile = vscode.Uri.file(path.join(outputDir, fileName));

            await vscode.workspace.fs.writeFile(outputFile, new TextEncoder().encode(markdown));
            generatedFiles.push(outputFile);

            progress.report({
              increment: (50 / validFlows.length),
              message: `Generated ${i + 1}/${validFlows.length}: ${safeName}`
            });
          }

          progress.report({ increment: 100 });

          const choice = await vscode.window.showInformationMessage(
            `✅ Generated ${validFlows.length} flow documentation file(s)`,
            'Open Folder',
            'Open First File'
          );

          if (choice === 'Open Folder') {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outputDir));
          } else if (choice === 'Open First File' && generatedFiles.length > 0) {
            const doc = await vscode.workspace.openTextDocument(generatedFiles[0]);
            await vscode.window.showTextDocument(doc, { preview: false });
            await vscode.commands.executeCommand('markdown.showPreview', generatedFiles[0]);
          }
        }
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Documentation generation failed: ${err.message}`);
    }
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
      const root = vscode.workspace.workspaceFolders![0].uri;
      const config = await this.loadConfig(root.fsPath);
      const uris = await this.selectFlows('Select flow files to fix:', config.ignore);
      if (!uris) return;
      if (Object.keys(config.rules).length === 0) {
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
      const fixFsPaths = toFsPaths(uris);
      const parsed = await core.parse(fixFsPaths);
      results = core.scan(parsed, { rules: config.rules, betamode: config.betamode, ignoreFlows: config.ignoreFlows, exceptions: config.exceptions, subflowResolver: await buildWorkspaceResolver(fixFsPaths) });
    }
    if (results.length === 0) {
      vscode.window.showInformationMessage('No issues to fix.');
      ScanOverview.createOrShow(this.context.extensionUri, []);
      return;
    }
    ScanOverview.createOrShow(this.context.extensionUri, results);
    const fixed = core.fix(results);

    if (fixed.length === 0) {
      vscode.window.showInformationMessage('No auto-fixable issues found.');
      return;
    }

    // Count total fixes across all flows
    const totalFixes = fixed.reduce((sum, r) => {
      return sum + r.ruleResults.reduce((s, rr) => s + rr.details.length, 0);
    }, 0);

    // Ask user how to proceed via QuickPick (interactive, escape defaults to first option)
    const choice = await vscode.window.showQuickPick(
      [
        { label: '$(preview) Preview Changes', value: 'preview', description: 'Review diff before applying' },
        { label: '$(check) Apply All', value: 'apply', description: 'Apply fixes without preview' },
        { label: '$(close) Cancel', value: 'cancel', description: 'Abort fix operation' }
      ],
      {
        placeHolder: `${totalFixes} fix(es) in ${fixed.length} flow(s) - How would you like to proceed?`,
        title: 'Flow Scanner Fix'
      }
    );

    // Default to preview if user escapes or makes no selection
    const action = choice?.value ?? 'preview';

    if (action === 'cancel') {
      return;
    }

    if (action === 'preview') {
      // Register content provider if not already registered
      this.registerPreviewProvider();

      // Show diff for each file using virtual documents
      for (const r of fixed) {
        const originalUri = vscode.Uri.file(r.flow.fsPath);
        const newContent = r.flow.toXMLString();

        // Create a virtual URI for the proposed changes
        const proposedUri = originalUri.with({
          scheme: 'flowscanner-preview',
          query: Buffer.from(newContent).toString('base64')
        });

        // Open diff view (don't use preview mode so tabs stay open)
        await vscode.commands.executeCommand(
          'vscode.diff',
          originalUri,
          proposedUri,
          `Fix Preview: ${path.basename(r.flow.fsPath)}`,
          { preview: false }
        );
      }

      // Non-blocking notification - user can review tabs at their leisure
      const confirm = await vscode.window.showInformationMessage(
        `Review the ${fixed.length} diff tab(s) above, then click Apply when ready.`,
        'Apply Changes',
        'Cancel'
      );

      // Close preview tabs
      await vscode.commands.executeCommand('workbench.action.closeEditorsInGroup');

      if (confirm !== 'Apply Changes') {
        vscode.window.showInformationMessage('Fix cancelled.');
        return;
      }
    }

    // Apply fixes
    for (const r of fixed) {
      const uri = vscode.Uri.file(r.flow.fsPath);
      const newContent = r.flow.toXMLString();
      const bytes = new TextEncoder().encode(newContent);
      await vscode.workspace.fs.writeFile(uri, bytes);
    }

    await CacheProvider.instance.set('results', fixed);
    ScanOverview.createOrShow(this.context.extensionUri, fixed);
    vscode.window.showInformationMessage(`Applied ${totalFixes} fix(es) to ${fixed.length} flow(s).`);
  }

  private previewProviderRegistered = false;

  private registerPreviewProvider() {
    if (this.previewProviderRegistered) return;

    const provider: vscode.TextDocumentContentProvider = {
      provideTextDocumentContent(uri: vscode.Uri): string {
        // Decode the content from the query parameter
        return Buffer.from(uri.query, 'base64').toString('utf-8');
      }
    };

    this.context.subscriptions.push(
      vscode.workspace.registerTextDocumentContentProvider('flowscanner-preview', provider)
    );
    this.previewProviderRegistered = true;
  }

  private async selectFlows(prompt: string, configIgnore?: string[]): Promise<vscode.Uri[] | undefined> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (!root) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }
    const paths = await new SelectFlows(root, prompt).execute(root, configIgnore);
    if (!paths.length) {
      vscode.window.showInformationMessage('No flow files selected.');
      return;
    }
    return toUris(paths);
  }

  private async pickOutputDirectory(defaultDir: string): Promise<string | undefined> {
    const uri = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: vscode.Uri.file(defaultDir),
      openLabel: 'Select output folder'
    });

    return uri?.[0]?.fsPath;
  }

}