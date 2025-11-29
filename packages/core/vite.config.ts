import { resolve } from "path";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["umd", "cjs"],
      name: "lightningflowscanner",
    },
    minify: true,
    rollupOptions: {
      external: ["fast-xml-parser"],
      output: {
        globals: {
          'fast-xml-parser': "fast-xml-parser",
          fs: "fs",
          path: "path",
        },
      },
    },
    ssr: false,
  },
  plugins: [nodePolyfills({ include: ["path", "fs"], protocolImports: true })],

  resolve: { alias: { src: resolve("src/") } },
});
