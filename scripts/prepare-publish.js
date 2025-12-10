// packages/core/scripts/prepare-publish.js
const fs = require('fs');
const path = require('path');

// Absolutify relative links for NPM context
function absolutifyLinks(content) {
  const repoBase = 'https://github.com/Flow-Scanner/lightning-flow-scanner';
  const blobBase = `${repoBase}/blob/main/`;

  // Special mappings for overview tabs
  const specials = {
    'SECURITY.md': `${repoBase}?tab=security-ov-file`,
    'security.md': `${repoBase}?tab=security-ov-file`,
    'CONTRIBUTING.md': `${repoBase}?tab=contributing-ov-file`,
    'contributing.md': `${repoBase}?tab=contributing-ov-file`,
  };

  // Regex for markdown links: [text](relativePath) — skip absolute, anchors, root-absolute, mailto
  content = content.replace(/\[([^\]]+)\]\(((?!https?:|#|\/|mailto:)[^\)]+)\)/g, (match, text, url) => {
    const trimmedUrl = url.trim();
    const newUrl = specials[trimmedUrl] || blobBase + trimmedUrl;
    return `[${text}](${newUrl})`;
  });

  // Regex for HTML links: <a href="relativePath">
  content = content.replace(/<a\s+href="((?!https?:|#|\/|mailto:)[^"]+)"/g, (match, url) => {
    const trimmedUrl = url.trim();
    const newUrl = specials[trimmedUrl] || blobBase + trimmedUrl;
    return `<a href="${newUrl}"`;
  });

  // Regex for img src="relativePath" — skip absolute (e.g., raw.githubusercontent.com)
  content = content.replace(/<img\s+[^>]*src="((?!https?:)[^"]+)"/g, (match, url) => {
    const trimmedUrl = url.trim();
    const newUrl = specials[trimmedUrl] || blobBase + trimmedUrl;
    return match.replace(url, newUrl);
  });

  return content;
}

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
      require: "./index.js",
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
    let content = fs.readFileSync(source, 'utf8');
    if (f.endsWith('.md') && f !== 'LICENSE.md') {  // Absolutify MD files except LICENSE
      content = absolutifyLinks(content);
    }
    fs.writeFileSync(dest, content);
  }
});

// Write the cleaned package.json
fs.writeFileSync(
  path.join('out', 'package.json'),
  JSON.stringify(publishPkg, null, 2) + '\n'
);

console.log('✓ Compiled package in out/');