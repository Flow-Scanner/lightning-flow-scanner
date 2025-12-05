import { CacheProvider } from '../providers/cache-provider';
import * as vscode from 'vscode';


export default class MessageService {
  constructor(private webview: vscode.Webview) {}

  onInfo(query: any) {
    if (!query.value) {
      return;
    }
    vscode.window.showInformationMessage(query.value);
  }

  onError(query: any) {
    if (!query.value) {
      return;
    }
    vscode.window.showErrorMessage(query.value);
  }

  openDocumentation(query: any) {
    vscode.commands.executeCommand('flowscanner.openDocumentation');
  }

  scanFlows(query: any) {
    vscode.commands.executeCommand('flowscanner.scanFlows');
  }

  fixFlows(query: any) {
    vscode.commands.executeCommand('flowscanner.fixFlows');
  }

  configRules(query: any) {
    vscode.commands.executeCommand('flowscanner.configRules');
  }

  openVsxReviews(_query: any) {
    const reviewUrl =
      "https://open-vsx.org/extension/ForceConfigControl/lightning-flow-scanner-vsx/reviews";
    vscode.env.openExternal(vscode.Uri.parse(reviewUrl));
  }

  openReviewPage(query: any) {
  const url = query.url || "https://marketplace.visualstudio.com/items?itemName=ForceConfigControl.lightning-flow-scanner-vsx";
  vscode.env.openExternal(vscode.Uri.parse(url));
}

  getCache(query: any) {
    const { nonce, key } = query;
    this.sendResponse(
      () => Promise.resolve(CacheProvider.instance.get(key)),
      nonce
    );
  }

  setCache(query: any) {
    const { nonce, key, value } = query;
    this.sendResponse(
      () => Promise.resolve(CacheProvider.instance.set(key, value)),
      nonce
    );
  }

  private async sendResponse(fetchData: Function, nonce: string) {
    try {
      const result = await fetchData();
      this.webview.postMessage({
        ok: true,
        data: result,
        nonce,
      });
    } catch (e: any) {
      this.webview.postMessage({
        ok: false,
        error: e?.message || 'generic_error',
        nonce,
      });
    }
  }

  onVsMessage(data: any) {
    const { type, ...query } = data;
    if (type in this) {
      (this as any)[type](query);
    } else {
      this.sendResponse(() => Promise.reject('method not found'), query.nonce);
    }
  }
}
