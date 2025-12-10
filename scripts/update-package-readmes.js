const fs = require('fs');
const path = require('path');

const mainReadme = fs.readFileSync('README.md', 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// Extract shared header block from root README
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
// NEW: Absolutify relative links for package READMEs (npm/open-vsx context)
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

// ─────────────────────────────────────────────────────────────────────────────
// Shared content
const sharedHeader = extractHeaderBlock(mainReadme);
const defaultRules = ensureSeparator(extractSection(mainReadme, 'Default Rules'));
const configuration = ensureSeparator(extractSection(mainReadme, 'Configuration'));

// ─────────────────────────────────────────────────────────────────────────────
// Per-package GIF blocks
const packageGifs = {
  cli: `
<p align="center">
  <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/docs/media/cli.gif" alt="Flow Overview"/>
</p>
`,
  vsx: `
<p align="center">
  <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/docs/media/vsx.gif" alt="Flow Overview"/>
</p>
`,
  action: `
<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/docs/media/action.gif"/>
  </a>
</p>
`
};

// ─────────────────────────────────────────────────────────────────────────────
// Sync function — fully stable, GIF always injected
function syncPackageReadme(packagePath, packageName) {
  const readmePath = path.join(packagePath, 'README.md');
  if (!fs.existsSync(readmePath)) {
    console.warn(`README not found: ${readmePath}`);
    return;
  }

  let content = fs.readFileSync(readmePath, 'utf8');

  const firstSeparatorIndex = content.search(/\n---\s*\n/);
  if (firstSeparatorIndex === -1) {
    console.warn(`No --- separator found in ${packageName} README`);
    return;
  }

  const afterSeparator = content.slice(firstSeparatorIndex + 4);

  // Resolve GIF
  const lower = packageName.toLowerCase();
  const gifBlock = packageGifs[lower] || '';

  // NEW LOGIC:
  // We must put the GIF BEFORE the separator, so we reconstruct like this:
  //
  // sharedHeader = "<root header>\n\n---\n"
  //
  // We want to strip the ending "---\n" from sharedHeader,
  // insert GIF,
  // then re-add "---\n"
  //
  const sharedParts = sharedHeader.split('---');
  const sharedHeaderBeforeDash = sharedParts[0].trim(); // everything before the separator

  // Build correct header ordering
  const newHeader =
    sharedHeaderBeforeDash +         // root badges + banner + slogan
    '\n\n' +
    gifBlock +                       // GIF goes BEFORE the separator
    '\n---\n';                       // separator reinserted

  // rebuild final readme
  content = newHeader + afterSeparator;

  // 3. Sync shared sections
  content = replaceSection(content, 'Default Rules', defaultRules);
  content = replaceSection(content, 'Configuration', configuration);

  // NEW: Absolutify links for package context (npm/open-vsx)
  content = absolutifyLinks(content);

  // 4. Cleanup
  content = content
    .replace(/---\s*\n\s*---/g, '---')
    .replace(/\n{4,}/g, '\n\n\n')
    .trimEnd() + '\n';

  fs.writeFileSync(readmePath, content);
  console.log(`${packageName} README synchronized — GIF placed BEFORE separator`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Run sync
console.log('Syncing documentation headers and shared sections...\n');

syncPackageReadme('packages/cli', 'cli');
syncPackageReadme('packages/action', 'action');
syncPackageReadme('packages/vsx', 'vsx');

console.log('\nAll package READMEs are now in sync!');