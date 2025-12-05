import { ExtensionContext } from 'vscode';

interface DefaultState {
  [key: string]: any;
}

// Usage in the CacheProvider class
export class CacheProvider {
  private readonly cacheName: string;
  private cache: DefaultState;

  static instance: CacheProvider;

  private constructor(
      private context: ExtensionContext,
      defaultState?: DefaultState
  ) {
      this.cacheName = 'flowscanner';
      this.cache =
          this.context.globalState.get(this.cacheName, defaultState) ?? {};
  }

  static init(context: ExtensionContext, defaultState?: DefaultState) {
      this.instance = new CacheProvider(context, defaultState);
  }

  get(key: string) {
      return this.cache[key];
  }

  async set(key: string, value: any) {
      this.cache[key] = value;
      await this.context.globalState.update(this.cacheName, this.cache);
  }
}
