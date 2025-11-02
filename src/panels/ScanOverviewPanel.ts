import * as vscode from "vscode";
import * as uuid from "uuid";
import { convertArrayToCSV } from "convert-array-to-csv";
import { ViolationOverview } from "./ViolationOverviewPanel";
import { ScanResult } from "@flow-scanner/lightning-flow-scanner-core";

export class ScanOverview {
  public static currentPanel: ScanOverview | undefined;
  public static readonly viewType = "report";
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private isDownloading = false;

  public static createOrShow(
    extensionUri: vscode.Uri,
    scanResults: ScanResult[]
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ScanOverview.currentPanel) {
      ScanOverview.currentPanel._panel.reveal(column);
      ScanOverview.currentPanel._update(scanResults);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      ScanOverview.viewType,
      "Scan Results",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out/compiled"),
        ],
      }
    );
    ScanOverview.currentPanel = new ScanOverview(
      panel,
      extensionUri,
      scanResults
    );
  }

  public static kill() {
    ScanOverview.currentPanel?.dispose();
    ScanOverview.currentPanel = undefined;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    scanResults: ScanResult[]
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._update(scanResults);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    ScanOverview.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update(scanResults: ScanResult[]) {
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
        case "viewAll": {
          if (!data.value) {
            return;
          }
          ViolationOverview.createOrShow(this._extensionUri, data.value, "All");
          break;
        }
        case "goToDetails": {
          if (!data.value) {
            return;
          }
          ViolationOverview.createOrShow(
            this._extensionUri,
            [data.value],
            data.value.flow.label
          );
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case "init-view": {
          if (scanResults) {
            webview.postMessage({
              type: "init",
              value: scanResults,
            });
          }
          return;
        }
        case "download": {
          let saveResult = await vscode.window.showSaveDialog({
            filters: {
              csv: [".csv"],
            },
          });
          const csv = convertArrayToCSV(data.value);
          await vscode.workspace.fs.writeFile(saveResult, Buffer.from(csv));
          await vscode.window.showInformationMessage(
            "Downloaded file: " + saveResult.fsPath
          );
        }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "ScanOverview.js")
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "out/compiled",
        "ScanOverview.css"
      )
    );
    const tabulatorStyles = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "tabulator.css")
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
