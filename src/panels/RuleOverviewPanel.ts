
import * as vscode from "vscode";
import * as uuid from 'uuid';

export class RuleOverview {
  public static currentPanel: RuleOverview | undefined;
  public static readonly viewType = "rules";
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    if (RuleOverview.currentPanel) {
      RuleOverview.currentPanel._panel.reveal(column);
      RuleOverview.currentPanel._update();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      RuleOverview.viewType,
      "Flow Rules",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
            extensionUri,
            vscode.Uri.joinPath(extensionUri, 'media'),
            vscode.Uri.joinPath(extensionUri, 'out', 'compiled'),
          ],
      }
    );
    RuleOverview.currentPanel = new RuleOverview(panel, extensionUri);
  }
  public static kill() {
    RuleOverview.currentPanel?.dispose();
    RuleOverview.currentPanel = undefined;
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

  }
  
  public dispose() {
    RuleOverview.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
  private async _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        case 'init-view': {
          webview.postMessage({
            type: 'init'
          });
          return;
        }
        case "globalSearch": {
          webview.postMessage({ type: "applyGlobalSearch", value: data.value });
          break;
        }
      }
    });
  }
  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, "out/compiled", "RuleOverview.js")
    );
    const styleUri = webview.asWebviewUri(
       vscode.Uri.joinPath(this._extensionUri, "out/compiled", "RuleOverview.css")
    );
    const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "reset.css"
    ));
    const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "vscode.css"
    ));
    const nonce = uuid.v4();
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesResetUri}" rel="stylesheet">
        <link href="${stylesMainUri}" rel="stylesheet">
        <link href="${styleUri}" rel="stylesheet">
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
