// packages/core/scripts/prepare-publish.js
const fs = require('fs');
const path = require('path');

// Read the source package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Create a new package.json for publishing
const publishPkg = {
  ...pkg,
  // Fix paths - in the published package, files are at the root of out/
  main: "index.js",
  types: "index.d.ts",
  exports: {
    ".": {
      import: "./index.js",
      types: "./index.d.ts"
    }
  },
  // Remove dev-only scripts
  scripts: undefined,
  devDependencies: undefined
};

// Copy root files from monorepo root
['README.md','LICENSE.md','SECURITY.md','CONTRIBUTING.md'].forEach(f => {
  const source = path.join('..', '..', f);
  const dest = path.join('out', f);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
  }
});

// Write the cleaned package.json
fs.writeFileSync(
  path.join('out', 'package.json'),
  JSON.stringify(publishPkg, null, 2) + '\n'
);

console.log('✓ Prepared package for publishing in out/');