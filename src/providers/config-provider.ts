// src/providers/config-loader.ts
import { cosmiconfig } from 'cosmiconfig';

const moduleName = 'flow-scanner';

export async function loadScannerConfig(workspacePath: string): Promise<any> {
  const explorer = cosmiconfig(moduleName, {
    searchPlaces: [
      'package.json',
      `.${moduleName}.yaml`,
      `.${moduleName}.yml`,
      `.${moduleName}.json`,
      `config/.${moduleName}.yaml`,
      `config/.${moduleName}.yml`,
      '.flow-scanner',
    ],
  });

  const result = await explorer.search(workspacePath);
  return result?.config ?? {};
}