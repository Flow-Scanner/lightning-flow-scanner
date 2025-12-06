const fs = require('fs');
const path = require('path');

const mainReadme = fs.readFileSync('README.md', 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// Extract the full header block from root README (badges + banner + slogan) until ---
function extractHeaderBlock(content) {
  const separatorMatch = content.match(/^\s*---\s*$/m);
  if (!separatorMatch) {
    console.warn('No --- separator found in root README');
    return '';
  }
  const header = content.slice(0, separatorMatch.index).trim();
  return header + '\n\n---\n';
}

// Extract shared sections (unchanged)
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
    console.warn(`Warning: Section "## ${header}" not found in target`);
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
  return before.trimEnd() + '\n\n' + newContent + '\n\n' + after;
}

function ensureSeparator(content) {
  return content.replace(/^---\s*\n/m, '').replace(/\n\s*---\s*$/m, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared content from root
const sharedHeader = extractHeaderBlock(mainReadme);           // badges + banner + slogan + ---
const defaultRules = ensureSeparator(extractSection(mainReadme, 'Default Rules'));
const configuration = ensureSeparator(extractSection(mainReadme, 'Configuration'));

// ─────────────────────────────────────────────────────────────────────────────
// Sync function — now also syncs header and preserves package-specific demo GIF
function syncPackageReadme(packagePath, packageName) {
  const readmePath = path.join(packagePath, 'README.md');
  if (!fs.existsSync(readmePath)) {
    console.warn(`README not found: ${readmePath}`);
    return;
  }

  let content = fs.readFileSync(readmePath, 'utf8');

  // 1. Replace everything up to and including the first --- with root header
  const firstSeparatorIndex = content.search(/\n---\s*\n/);
  if (firstSeparatorIndex === -1) {
    console.warn(`No --- separator found in ${packageName} README`);
    return;
  }

  const afterSeparator = content.slice(firstSeparatorIndex + 4); // +4 to skip "\n---\n" or similar
  content = sharedHeader + afterSeparator;

  // 2. Sync shared sections
  content = replaceSection(content, 'Default Rules', defaultRules);
  content = replaceSection(content, 'Configuration', configuration);

  // 3. Clean up formatting
  content = content
    .replace(/---\s*\n\s*---/g, '---')
    .replace(/\n{4,}/g, '\n\n\n')
    .trimEnd() + '\n';

  fs.writeFileSync(readmePath, content);
  console.log(`${packageName} README synchronized (header + sections)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Run it
console.log('Syncing documentation headers and shared sections...\n');

syncPackageReadme('packages/cli', 'CLI');
syncPackageReadme('packages/action', 'GitHub Action');
syncPackageReadme('packages/vsx', 'VS Code Extension');

console.log('\nAll package READMEs are now in sync!');