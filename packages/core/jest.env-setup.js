const fs = require("fs");
const path = require("path");

module.exports = () => {
  if (!process.env.UMD_PATH) {
    console.log("UMD Setup: No UMD_PATH—skipping (Node-only mode)");
    return;
  }

  const umdFilePath = path.resolve(process.env.UMD_PATH);

  if (!fs.existsSync(umdFilePath)) {
    console.warn("UMD Setup: File not found at", umdFilePath, "—skipping.");
    return;
  }

  let umdCode = fs.readFileSync(umdFilePath, "utf8");
  const fastXmlParser = require("fast-xml-parser");

  // Vite UMD pattern: (function(global, factory) { ... })(this, function(exports, dependency) { ... });
  // We need to extract and execute the factory function

  // Try to match Vite's UMD pattern more flexibly
  const viteUmdMatch = umdCode.match(
    /\(function\s*\([^,]+,\s*(\w+)\)\s*\{[\s\S]*?\}\)\s*\(this,\s*function\s*\((\w+)(?:,\s*(\w+))?\)\s*\{([\s\S]+)\}\s*\)\s*;?\s*$/
  );

  if (viteUmdMatch) {
    const factoryBody = viteUmdMatch[4];
    const exportsParam = viteUmdMatch[2];
    const depParam = viteUmdMatch[3];

    try {
      // Create the factory function with proper parameters
      const factoryFn = depParam
        ? new Function(exportsParam, depParam, factoryBody)
        : new Function(exportsParam, factoryBody);

      // Create exports object and invoke factory
      const exports = {};
      if (depParam) {
        factoryFn(exports, fastXmlParser);
      } else {
        factoryFn(exports);
      }

      // Assign to global
      global.lightningflowscanner = exports;

      if (Object.keys(exports).length === 0) {
        console.error("UMD Setup: WARNING - exports object is empty!");
      }
    } catch (e) {
      console.error("UMD Factory error:", e.message);
      console.error("Stack:", e.stack);
    }
  } else {
    // Fallback: Try direct execution approach

    try {
      // Create a mock global/window context
      const mockGlobal = {};
      const mockFactory = new Function(
        "global",
        "factory",
        `
        return (function(root, factoryFn) {
          if (typeof exports === 'object' && typeof module !== 'undefined') {
            factoryFn(exports, require('fast-xml-parser'));
          } else {
            factoryFn((root.lightningflowscanner = {}), root.fastXmlParser);
          }
        })(global, factory);
      `
      );

      // Execute in controlled context
      const vm = require("vm");
      const sandbox = {
        exports: {},
        require: (id) => (id === "fast-xml-parser" ? fastXmlParser : require(id)),
        module: { exports: {} },
        console: console,
      };

      vm.runInNewContext(umdCode, sandbox);

      // Check what got exported
      const exports = sandbox.exports.default || sandbox.exports || sandbox.module.exports;

      if (exports && Object.keys(exports).length > 0) {
        global.lightningflowscanner = exports;
      } else {
        console.error("UMD Setup: Direct execution failed - no exports found");
      }
    } catch (e) {
      console.error("UMD Direct execution error:", e.message);
      console.error("Stack:", e.stack.slice(0, 400));
    }
  }
};
