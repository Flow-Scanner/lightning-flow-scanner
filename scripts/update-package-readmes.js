// scripts/generate-cli-readme.js
// Generates CLI README by preserving CLI-specific content and injecting
// Default Rules and Configuration sections from main README

const fs = require('fs');
const path = require('path');

// Load both READMEs
const mainReadme = fs.readFileSync('README.md', 'utf8');
const cliReadme = fs.readFileSync('packages/cli/README.md', 'utf8');

/**
 * Extract a section from markdown starting with ## Header
 * @param {string} content - The markdown content
 * @param {string} header - The header name (without ##)
 * @returns {string} The extracted section
 */
function extractSection(content, header) {
  const pattern = new RegExp(`^## ${header}$`, 'm');
  const match = content.match(pattern);
  
  if (!match) {
    console.warn(`Warning: Section "## ${header}" not found`);
    return `<!-- Section "${header}" not found -->`;
  }
  
  const start = match.index;
  const fromStart = content.slice(start);
  
  // Find next ## that's not part of a link or code block
  const lines = fromStart.split('\n');
  let endIndex = fromStart.length;
  let inCodeBlock = false;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // Found next section header (not in code block, starts at line beginning)
    if (!inCodeBlock && /^##\s+[^#]/.test(line)) {
      endIndex = lines.slice(0, i).join('\n').length;
      break;
    }
  }
  
  return fromStart.slice(0, endIndex).trim();
}

/**
 * Replace a section in the CLI README
 * @param {string} content - Current CLI README content
 * @param {string} header - Section header to replace
 * @param {string} newContent - New content for the section
 * @returns {string} Updated content
 */
function replaceSection(content, header, newContent) {
  const pattern = new RegExp(`^## ${header}$`, 'm');
  const match = content.match(pattern);
  
  if (!match) {
    console.warn(`Warning: Section "## ${header}" not found in CLI README`);
    return content;
  }
  
  const start = match.index;
  
  // Look backwards to find if there's a --- separator before this section
  const beforeSection = content.slice(0, start);
  const lastSeparatorMatch = beforeSection.match(/---\s*\n\s*$/);
  const actualStart = lastSeparatorMatch ? beforeSection.lastIndexOf('---') : start;
  
  const fromStart = content.slice(start);
  
  // Find next ## section
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

/**
 * Ensure section has proper separator before it
 * @param {string} content - Section content
 * @returns {string} Section with separator
 */
function ensureSeparator(content) {
  // Remove any existing --- at start or end
  content = content.replace(/^---\s*\n/m, '').replace(/\n\s*---\s*$/m, '');
  // Add separator before section
  return '---\n\n' + content;
}

// Extract sections from main README
console.log('Extracting sections from main README...');
let defaultRules = extractSection(mainReadme, 'Default Rules');
let configuration = extractSection(mainReadme, 'Configuration');
let development = extractSection(mainReadme, 'Development');

// Ensure sections have separators
defaultRules = ensureSeparator(defaultRules);
configuration = ensureSeparator(configuration);
development = ensureSeparator(development);

// Update CLI README
console.log('Updating CLI README...');
let updatedCli = cliReadme;

// Replace Default Rules section
updatedCli = replaceSection(updatedCli, 'Default Rules', defaultRules);

// Replace Configuration section
updatedCli = replaceSection(updatedCli, 'Configuration', configuration);

// Replace Development section (or append if it doesn't exist)
if (cliReadme.includes('## Development')) {
  updatedCli = replaceSection(updatedCli, 'Development', development);
} else {
  // Append Development section before the final newline
  updatedCli = updatedCli.trimEnd() + '\n\n' + development + '\n';
}

// Clean up any duplicate separators (--- followed by --- with only whitespace between)
updatedCli = updatedCli.replace(/---\s*\n\s*---/g, '---');

// Ensure --- before Installation section if not present
if (!/---\s*\n+## Installation/m.test(updatedCli)) {
  updatedCli = updatedCli.replace(/\n+## Installation/m, '\n\n---\n\n## Installation');
}

// Clean up any multiple consecutive blank lines (max 2)
updatedCli = updatedCli.replace(/\n{4,}/g, '\n\n\n');

// Ensure file ends with single newline
updatedCli = updatedCli.trimEnd() + '\n';

// Write updated CLI README
const cliReadmePath = path.join('packages', 'cli', 'README.md');
fs.writeFileSync(cliReadmePath, updatedCli);

console.log('✓ packages/cli/README.md updated successfully');
console.log('  - Default Rules section replaced');
console.log('  - Configuration section replaced');
console.log('  - Development section replaced/added');
console.log('  - All other CLI-specific content preserved');