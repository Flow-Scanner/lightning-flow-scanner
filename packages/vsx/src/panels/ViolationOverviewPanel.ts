import { ScanOverview } from "./ScanOverviewPanel";
import * as vscode from "vscode";
import * as uuid from "uuid";
import { exportSarif, ScanResult, flatten } from "@flow-scanner/lightning-flow-scanner-core";
import { CacheProvider } from "../providers/cache-provider";
import { convertArrayToCSV } from "../libs/convertArrayToCSV";
import { ThemeHelper } from '../libs/ThemeHelper';

export class ViolationOverview {
  public static currentPanel: ViolationOverview | undefined;
  public static readonly viewType = "report";
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _allScanResults: ScanResult[] = [];
  private _currentScanResults: ScanResult[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    scanResults: ScanResult[],
    tab: string
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    let title = tab ? "Results " + tab : "All Results";
    if (
      ViolationOverview.currentPanel &&
      ViolationOverview.currentPanel._panel.title === title
    ) {
      ViolationOverview.currentPanel._panel.reveal(column);
      ViolationOverview.currentPanel._update(scanResults);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ViolationOverview.viewType,
      `${title}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );
    ViolationOverview.currentPanel = new ViolationOverview(
      panel,
      extensionUri,
      scanResults
    );
  }

  public static kill() {
    ViolationOverview.currentPanel?.dispose();
    ViolationOverview.currentPanel = undefined;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    scanResult: ScanResult[]
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._allScanResults = CacheProvider.instance.get("results") as ScanResult[] || scanResult;
    this._update(scanResult);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Add theme change listener
    const themeChangeListener = vscode.window.onDidChangeActiveColorTheme(() => {
      this._refreshWebview();
    });
    this._disposables.push(themeChangeListener);
  }

  public dispose() {
    ViolationOverview.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update(scanResults: ScanResult[]) {
    this._currentScanResults = scanResults;
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "goToFile": {
          if (!data.value) {
            return;
          }
          vscode.workspace.openTextDocument(data.value.path).then((doc) => {
            vscode.window.showTextDocument(doc);
          });
          break;
        }
        case "overview": {
          if (!data.value) {
            return;
          }
          ScanOverview.createOrShow(this._extensionUri, this._allScanResults);
          break;
        }
        case "searchFlowName": {
          webview.postMessage({ type: "applySearchFlowName", value: data.value });
          break;
        }
        case "searchAttributes": {
          webview.postMessage({ type: "applySearchAttributes", value: data.value });
          break;
        }
        case "init-view": {
          webview.postMessage({
            type: "init",
            value: scanResults,
          });
          return;
        }
        case "download": {
          if (!data.value || !Array.isArray(data.value) || data.value.length === 0) {
            await vscode.window.showInformationMessage(
              "No results found. Please make sure to complete a scan before downloading."
            );
            return;
          }

          const formatChoice = await vscode.window.showQuickPick(
            [
              { label: "CSV", description: "Comma-separated values", value: "csv" },
              { label: "SARIF", description: "Static Analysis Results Interchange Format", value: "sarif" }
            ],
            {
              placeHolder: "Select export format (Esc to cancel)",
              canPickMany: false,
              ignoreFocusOut: false,
            }
          );

          if (!formatChoice) return;

          const chosenFormat = formatChoice.value;
          const filterExt = chosenFormat === "sarif" ? "sarif" : "csv";
          const filterLabel = chosenFormat === "sarif" ? "SARIF" : "CSV";

          const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri;
          const saveResult = await vscode.window.showSaveDialog({
            defaultUri,
            filters: { [filterLabel]: [filterExt] },
            title: `Save ${chosenFormat.toUpperCase()} file`,
          });

          if (!saveResult) return;

          try {
            let content: string;

            if (chosenFormat === "sarif") {
              const cachedResults = CacheProvider.instance.get("results") as ScanResult[] | undefined;
              if (!cachedResults || cachedResults.length === 0) {
                await vscode.window.showWarningMessage("No scan data available for SARIF export. Please run a scan first.");
                return;
              }
              content = exportSarif(cachedResults);
            } else {
              // ----  CSV: flatten to one record per violation (consistent with CLI)
              const cachedResults = CacheProvider.instance.get("results") as ScanResult[] | undefined;
              if (!cachedResults || cachedResults.length === 0) {
                await vscode.window.showWarningMessage("No scan data available for CSV export. Please run a scan first.");
                return;
              }
              // Use current scan results if viewing filtered/individual flow, otherwise use all cached results
              const resultsToExport = this._currentScanResults.length > 0 ? this._currentScanResults : cachedResults;
              const flatViolations = flatten(resultsToExport);
              content = convertArrayToCSV(flatViolations);
            }

            const bytes = new TextEncoder().encode(content);
            await vscode.workspace.fs.writeFile(saveResult, bytes);
            await vscode.window.showInformationMessage(
              `Downloaded ${chosenFormat.toUpperCase()} file: ${saveResult.fsPath}`
            );
          } catch (err: any) {
            await vscode.window.showErrorMessage(
              `Failed to export ${chosenFormat.toUpperCase()}: ${err?.message || err}`
            );
          }
          break;
        }
      }
    });
  }

  /**
   * Refreshes the webview HTML when theme changes
   */
  private _refreshWebview() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);

    // Re-send data to webview after HTML refresh
    webview.postMessage({
      type: "init",
      value: this._currentScanResults
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out/compiled",
        "ViolationOverview.js"
      )
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out/compiled",
        "ViolationOverview.css"
      )
    );
    const tabulatorCssFile = ThemeHelper.getTabulatorCssFilename();
    const tabulatorStyles = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", tabulatorCssFile)
    );
    const tabulatorCustomStyles = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "tabulator-custom.css")
    );
    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const nonce = uuid.v4();
    return `
            <!DOCTYPE html>
			<html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${tabulatorStyles}" rel="stylesheet">
                    <link href="${tabulatorCustomStyles}" rel="stylesheet">
                    <link href="${stylesResetUri}" rel="stylesheet">
                    <link href="${stylesMainUri}" rel="stylesheet">
                    <link href="${cssUri}" rel="stylesheet">
                    <script nonce="${nonce}">
                        const tsvscode = acquireVsCodeApi();
                    </script>
                </head>
                <body>
                    <script src="${scriptUri}" nonce="${nonce}"></script>
                </body>
			</html>`;
  }
}