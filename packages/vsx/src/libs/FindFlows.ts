import * as glob from "glob";

export function FindFlows(dir: string): string[] {
  // Normalize Windows paths → POSIX (required for glob)
  dir = dir.replace(/\\/g, "/");

  return glob.sync(`${dir}/**/*.{flow-meta.xml,flow}`, {
    ignore: ["**/node_modules/**"]
  });
}
