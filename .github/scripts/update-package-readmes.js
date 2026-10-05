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
  // Remove leading/trailing separators only (not internal ones)
  // Without 'm' flag, ^ and $ match start/end of string, not lines
  return content.replace(/^---\s*\n/, '').replace(/\n\s*---\s*$/, '');
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
    '.github/SECURITY.md': `${repoBase}?tab=security-ov-file`,
    '.github/CONTRIBUTING.md': `${repoBase}?tab=contributing-ov-file`,
    '.github/CODE_OF_CONDUCT.md': `${repoBase}?tab=coc-ov-file`,
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
  <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/docs/media/cli-demo.gif" alt="Flow Overview"/>
</p>
`,
  vsx: `
<p align="center">
  <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/docs/media/vsx-demo.gif" alt="Flow Overview"/>
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

// Core demo image — root README only (it doubles as core's npm README)
// Each package README drops its own version badge: npm and the marketplaces
// already show that version next to the title.
const OWN_BADGE_ALT = {
  cli: 'CLI version',
  vsx: 'VS Code version',
  action: 'GitHub Action version',
};

function removeOwnBadge(header, packageName) {
  const alt = OWN_BADGE_ALT[packageName.toLowerCase()];
  if (!alt) return header;
  const escaped = alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const badge = new RegExp(`\\n[ \\t]*<a [^>]*>\\s*<img [^>]*alt="${escaped}"[^>]*>\\s*<\\/a>`);
  if (!badge.test(header)) console.warn(`Own badge "${alt}" not found for ${packageName}`);
  return header.replace(badge, '');
}

// Package READMEs end their badge row with Core, which the root README
// leaves out since it is core's own page.
const CORE_BADGE = `  <a href="https://www.npmjs.com/package/@flow-scanner/lightning-flow-scanner-core">
    <img src="https://badgen.net/npm/v/@flow-scanner/lightning-flow-scanner-core?label=Core" alt="Core version">
  </a>`;

function addCoreBadge(header) {
  if (header.includes('alt="Core version"')) return header;
  const end = header.indexOf('</p>');
  if (end === -1) {
    console.warn('No badge row found for the Core badge');
    return header;
  }
  return header.slice(0, end).trimEnd() + '\n' + CORE_BADGE + '\n' + header.slice(end);
}

const CORE_DEMO = /\n*<p align="center">\s*<img [^>]*core-demo\.png[^>]*>\s*<\/p>\n*/;

// Availability note — moved below the demo GIF in package READMEs
const AVAILABILITY_NOTE = /\n*<table align=\"center\"><tr><td>ℹ️ Also [\s\S]*?<\/table>\n*/;

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

  // Insert package-specific GIF right before --- with clean, consistent spacing
  const header = addCoreBadge(removeOwnBadge(sharedHeader, packageName));
  let newHeader = header;

  const gifBlockTrimmed = (packageGifs[lower] || '').trim();

  if (gifBlockTrimmed) {
    // Remove the trailing --- and any whitespace around it
    newHeader = header.replace(/\s*---\s*$/, '').trimEnd();
    newHeader = newHeader.replace(CORE_DEMO, '\n\n').trimEnd();

    // In the root README the availability note sits directly under the subtitle.
    // Package READMEs lead with the demo GIF, so the note belongs below it.
    let availabilityNote = '';
    const availabilityMatch = newHeader.match(AVAILABILITY_NOTE);
    if (availabilityMatch) {
      availabilityNote = availabilityMatch[0].trim();
      newHeader = newHeader.replace(AVAILABILITY_NOTE, '\n\n').trimEnd();
    }

    // Ensure exactly two blank lines before the GIF
    newHeader += '\n\n';

    // Add the GIF block
    newHeader += gifBlockTrimmed + '\n\n';

    if (availabilityNote) {
      newHeader += availabilityNote + '\n\n';
    }

    // Add the separator with exactly one blank line before it
    newHeader += '---\n';
  }
  // If no GIF (shouldn't happen for your packages), keep original sharedHeader (already ends with \n\n---\n)

  let rebuiltContent = newHeader.trimEnd();  // remove any trailing whitespace from newHeader

  // Add exactly one blank line after ---
  rebuiltContent += '\n\n';

  // Add the rest of the file, but skip leading blank lines in afterSeparator
  const trimmedAfter = afterSeparator.trimStart();

  content = rebuiltContent + trimmedAfter;

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