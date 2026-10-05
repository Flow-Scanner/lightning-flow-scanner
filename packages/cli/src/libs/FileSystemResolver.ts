import * as glob from "glob";
import pkg, {
  type FileSystemResolver as CoreFileSystemResolver,
  type FileSystemResolverOptions as CoreFileSystemResolverOptions,
} from "@flow-scanner/lightning-flow-scanner-core";
import { loadIgnorePatterns } from "./LoadIgnorePatterns.js";

// core is published as CommonJS; runtime values must come via the default export
const { FileSystemResolver: CoreResolver } = pkg;

/** CLI file discovery: async glob with .gitignore-aware ignore patterns. */
async function findFlowFiles(searchPath: string, ignorePatterns?: string[]): Promise<string[]> {
  // Normalize Windows paths → POSIX (required for glob)
  const normalizedPath = searchPath.replace(/\\/g, "/");
  return glob.glob("**/*.{flow-meta.xml,flow}", {
    cwd: normalizedPath,
    ignore: loadIgnorePatterns(normalizedPath, ignorePatterns),
    absolute: true,
  });
}

export type FileSystemResolverOptions = Omit<CoreFileSystemResolverOptions, "findFlowFiles">;
export type FileSystemResolver = CoreFileSystemResolver;

/**
 * Filesystem-based subflow resolver for the CLI: the shared core
 * implementation with the CLI's glob strategy injected.
 */
export const FileSystemResolver = {
  create(options: FileSystemResolverOptions): Promise<FileSystemResolver> {
    return CoreResolver.create({ ...options, findFlowFiles });
  },
};
