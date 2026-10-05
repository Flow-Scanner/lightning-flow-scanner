import {
  FileSystemResolver as CoreResolver,
  type FileSystemResolverOptions as CoreFileSystemResolverOptions,
} from "@flow-scanner/lightning-flow-scanner-core";
import { FindFlows } from "./FindFlows";

export type FileSystemResolverOptions = Omit<CoreFileSystemResolverOptions, "findFlowFiles">;
export type FileSystemResolver = CoreResolver;

/**
 * Filesystem-based subflow resolver for the VS Code extension: the shared
 * core implementation with the extension's FindFlows discovery injected.
 */
export const FileSystemResolver = {
  create(options: FileSystemResolverOptions): Promise<FileSystemResolver> {
    return CoreResolver.create({
      ...options,
      findFlowFiles: (searchPath, ignorePatterns) => FindFlows(searchPath, ignorePatterns),
    });
  },
};
