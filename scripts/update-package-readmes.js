// scripts/sync-docs.js
// Syncs shared sections from main README into CLI and Action READMEs
// Preserves all package-specific content (banners, usage, development, etc.)
const fs = require('fs');
const path = require('path');

const mainReadme = fs.readFileSync('README.md', 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — your original code, untouched (perfect)
function extractSection(content, header) {
  const pattern = new RegExp(`^## ${header}$`, 'm');
  const match = content.match(pattern);
  if (!match) {
    console.warn(`Warning: Section "## ${header}" not found`);
    return `<!-- Section "${header}" not found -->`;
  }
  const start = match.index;
  const fromStart = content.slice(start);
  const lines = fromStart.split('\n');
  let endIndex = fromStart.length;
  let inCodeBlock = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (!inCodeBlock && /^##\s+[^#]/.test(line)) {
      endIndex = lines.slice(0, i).join('\n').length;
      break;
    }
  }
  return fromStart.slice(0, endIndex).trim();
}

function replaceSection(content, header, newContent) {
  const pattern = new RegExp(`^## ${header}$`, 'm');
  const match = content.match(pattern);
  if (!match) {
    console.warn(`Warning: Section "## ${header}" not found`);
    return content;
  }
  const start = match.index;
  const beforeSection = content.slice(0, start);
  const lastSeparatorMatch = beforeSection.match(/---\s*\n\s*$/);
  const actualStart = lastSeparatorMatch ? beforeSection.lastIndexOf('---') : start;

  const fromStart = content.slice(start);
  const lines = fromStart.split('\n');
  let endIndex = fromStart.length;
  let inCodeBlock = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (!inCodeBlock && /^##\s+[^#]/.test(line)) {
      endIndex = lines.slice(0, i).join('\n').length;
      break;
    }
  }

  const before = content.slice(0, actualStart);
  const after = content.slice(start + endIndex);
  return before + newContent + '\n\n' + after;
}

function ensureSeparator(content) {
  content = content.replace(/^---\s*\n/m, '').replace(/\n\s*---\s*$/m, '');
  return '---\n\n' + content;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sections — only these get synced
const defaultRules = ensureSeparator(extractSection(mainReadme, 'Default Rules'));
const configuration = ensureSeparator(extractSection(mainReadme, 'Configuration'));

// ─────────────────────────────────────────────────────────────────────────────
// Sync function — reusable for any package
function syncPackageReadme(packagePath, packageName) {
  const readmePath = path.join(packagePath, 'README.md');
  if (!fs.existsSync(readmePath)) {
    console.warn(`README not found: ${readmePath}`);
    return;
  }

  let content = fs.readFileSync(readmePath, 'utf8');

  content = replaceSection(content, 'Default Rules', defaultRules);
  content = replaceSection(content, 'Configuration', configuration);

  // Clean up formatting
  content = content.replace(/---\s*\n\s*---/g, '---');
  content = content.replace(/\n{4,}/g, '\n\n\n');

  // FIX: Ensure --- before Installation (this was missing)
  if (!/---\s*\n+## Installation/m.test(content)) {
    content = content.replace(/\n+## Installation/m, '\n\n---\n\n## Installation');
  }

  content = content.trimEnd() + '\n';

  fs.writeFileSync(readmePath, content);
  console.log(`${packageName} README updated`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Run it
console.log('Syncing documentation...\n');

syncPackageReadme('packages/cli', 'CLI');
syncPackageReadme('packages/action', 'Action');

console.log('\nAll documentation synchronized!');