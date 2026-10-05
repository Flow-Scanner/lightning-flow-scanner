const fs = require('fs');
const path = require('path');

// Load the compiled RuleRegistry
const { ruleRegistry } = require('../../packages/core/out/main/config/RuleRegistry.js');

// Load README
const readmePath = path.join(__dirname, '../..', 'README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// System rules doc path
const systemRulesPath = path.join(__dirname, '../../docs', 'system-rules.md');

// 1. Extract metadata from RuleRegistry
function getRuleMetadata(ruleRegistry, options = {}) {
  const { systemOnly = false } = options;
  const rules = [];
  const allRuleIds = ruleRegistry.getAllRuleIds(true); // Include beta rules
  for (const ruleId of allRuleIds) {
    const entry = ruleRegistry.get(ruleId);
    const instance = ruleRegistry.createInstance(ruleId);
    const isSystemRule = instance.category === 'system';

    // Filter: systemOnly=true returns only system rules, systemOnly=false excludes them
    if (systemOnly && !isSystemRule) continue;
    if (!systemOnly && isSystemRule) continue;

    rules.push({
      ruleId: instance.ruleId,
      className: entry.legacyName,
      title: instance.label,
      description: instance.description,
      severity: instance.severity,
      category: instance.category,
      isBeta: entry.isBeta,
      isConfigurable: instance.isConfigurable,
      configurableOptions: instance.configurableOptions,
      isFixable: instance.isFixable
    });
  }
  return rules;
}

// 2. Sort rules by category, then severity, then alphabetically
function sortRules(rules) {
  const categoryOrder = { 'problem': 1, 'suggestion': 2, 'layout': 3, 'system': 4 };
  const severityOrder = { 'error': 1, 'warning': 2, 'note': 3 };
  return rules.sort((a, b) => {
    const catA = categoryOrder[a.category] || 999;
    const catB = categoryOrder[b.category] || 999;
    if (catA !== catB) return catA - catB;

    const sevA = severityOrder[a.severity?.toLowerCase()] || 999;
    const sevB = severityOrder[b.severity?.toLowerCase()] || 999;
    if (sevA !== sevB) return sevA - sevB;

    return a.title.localeCompare(b.title);
  });
}

// 3. Format severity with emoji
function formatSeverity(severity) {
  const severityMap = {
    'error': '🔴 *Error*',
    'warning': '🟡 *Warning*',
    'note': '🔵 *Note*'
  };
  return severityMap[severity?.toLowerCase()] || '🟡 *Warning*';
}

// 4. Format configurable options as markdown
function formatConfigurableOptions(options) {
  if (!options || options.length === 0) return '';

  let content = '\n\n';
  content += '| Option | Type | Default | Description |\n';
  content += '|--------|------|---------|-------------|\n';

  for (const opt of options) {
    const defaultVal = opt.defaultValue !== undefined ? `\`${opt.defaultValue}\`` : '-';
    content += `| ${opt.name} | ${opt.type} | ${defaultVal} | ${opt.description} |\n`;
  }

  return content;
}

// 5. Format each rule as markdown (now using ####)
function formatRule(rule) {
  const betaBadge = rule.isBeta
    ? ' ![Beta](https://img.shields.io/badge/status-beta-yellow)'
    : '';
  const fixableBadge = rule.isFixable
    ? ' ![Auto-Fix](https://img.shields.io/badge/-auto--fix-green)'
    : '';
  const optionsSection = formatConfigurableOptions(rule.configurableOptions);
  return `#### ${rule.title}${betaBadge}${fixableBadge}
${rule.description}

**Rule ID:** \`${rule.ruleId}\`
**Class Name:** _[${rule.className}](packages/core/src/main/rules/${rule.className}.ts)_
**Severity:** ${formatSeverity(rule.severity)}${optionsSection}`;
}

// Format rule for system rules doc (with relative path)
function formatSystemRule(rule) {
  const betaBadge = rule.isBeta
    ? ' ![Beta](https://img.shields.io/badge/status-beta-yellow)'
    : '';
  const fixableBadge = rule.isFixable
    ? ' ![Auto-Fix](https://img.shields.io/badge/-auto--fix-green)'
    : '';
  const optionsSection = formatConfigurableOptions(rule.configurableOptions);
  return `### ${rule.title}${betaBadge}${fixableBadge}
${rule.description}

**Rule ID:** \`${rule.ruleId}\`
**Class Name:** _[${rule.className}](../packages/core/src/main/rules/${rule.className}.ts)_
**Severity:** ${formatSeverity(rule.severity)}${optionsSection}`;
}

// 5. Build rules content with category headers + formal introductions
function buildRulesContent(rules, systemRuleCount = 0) {
  const categoryInfo = {
    problem: {
      header: '### Problems',
      intro: 'These rules detect anti-patterns and unsafe practices in your Flows that could break functionality, compromise security, or cause deployment failures.'
    },
    suggestion: {
      header: '### Suggestions',
      intro: 'These rules highlight areas where Flows can be improved. Following them increases reliability and long-term maintainability.'
    },
    layout: {
      header: '### Layout',
      intro: 'Focused on naming, documentation, and organization, these rules ensure Flows remain clear, easy to understand, and maintainable as automations grow.'
    }
  };

  let content = '';
  const categories = [...new Set(rules.map(r => r.category))];

  categories.forEach((cat, idx) => {
    const info = categoryInfo[cat] || { header: '### Other', intro: '' };

    // ← Changed: always add separator (including before the very first category)
    content += '---\n\n';

    content += `${info.header}\n\n${info.intro}\n\n`;

    rules.filter(r => r.category === cat).forEach(rule => {
      content += formatRule(rule) + '\n\n';
    });
  });

  // Add System rules section as a subcategory of Layout (no separator)
  if (systemRuleCount > 0) {
    content += '#### System (subcategory)\n\n';
    content += 'System rules are a subset of Layout rules that detect structural issues normally prevented by the Flow Builder UI. ';
    content += `See [System Rules Documentation](docs/system-rules.md) for the full list.\n\n`;
  }

  return content.trim();
}

// Build system rules document content
function buildSystemRulesContent(rules) {
  const hasBetaRules = rules.some(r => r.isBeta);

  let content = `# System Rules

System rules detect issues that are normally prevented by the Flow Builder UI. These rules are valuable when Flow XML files are edited directly by AI tools, scripts, or other automated processes.

## Enabling System Rules

System rules are disabled by default. To opt in:

\`\`\`yaml
# .flow-scanner.yml
systemRules: true
\`\`\`

Or programmatically:

\`\`\`typescript
import { scan } from '@flow-scanner/lightning-flow-scanner-core';

const results = scan(parsedFlows, {
  systemRules: true${hasBetaRules ? ',\n  betaMode: true    // Required for beta system rules' : ''}
});
\`\`\`

## Use Cases

- **AI-assisted development**: When AI tools edit Flow XML directly
- **Scripted modifications**: Automated flow generation or transformation
- **Migration scenarios**: Validate flows moved between orgs

## Available Rules

`;

  rules.forEach(rule => {
    content += formatSystemRule(rule) + '\n\n';
  });

  content += `---

*This document is auto-generated. Do not edit manually.*
`;

  return content;
}

function updateReadmeWithRules(readmeContent, rulesContent) {
  const startMarker = '<!-- START GENERATED_RULES -->';
  const endMarker = '<!-- END GENERATED_RULES -->';
  const startIndex = readmeContent.indexOf(startMarker);
  const endIndex = readmeContent.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find generated rules markers in README.md');
  }

  const before = readmeContent.substring(0, startIndex + startMarker.length);
  const after = readmeContent.substring(endIndex);

  return before + '\n\n' + rulesContent + '\n' + after;
}

// Main execution
try {
  console.log('📖 Generating README from rule source code...\n');

  // Get standard rules (excluding system rules)
  console.log('1️⃣  Extracting rule metadata from RuleRegistry...');
  const rules = getRuleMetadata(ruleRegistry, { systemOnly: false });
  console.log(`   ✅ Found ${rules.length} rules (${rules.filter(r => r.isBeta).length} beta)\n`);

  // Get system rules separately
  console.log('2️⃣  Extracting system rules...');
  const systemRules = getRuleMetadata(ruleRegistry, { systemOnly: true });
  console.log(`   ✅ Found ${systemRules.length} system rules\n`);

  console.log('3️⃣  Sorting rules by category, severity, and alphabetically...');
  const sortedRules = sortRules(rules);
  const sortedSystemRules = sortRules(systemRules);
  console.log(`   ✅ Rules sorted\n`);

  console.log('4️⃣  Building rules content with category introductions...');
  const rulesContent = buildRulesContent(sortedRules, sortedSystemRules.length);
  console.log(`   ✅ Rules content built\n`);

  console.log('5️⃣  Updating README.md...');
  const updatedReadme = updateReadmeWithRules(readmeContent, rulesContent);
  console.log(`   ✅ README updated\n`);

  console.log('6️⃣  Writing to README.md...');
  fs.writeFileSync(readmePath, updatedReadme, 'utf8');
  console.log(`   ✅ Written to ${readmePath}\n`);

  // Generate system rules doc if there are any
  if (sortedSystemRules.length > 0) {
    console.log('7️⃣  Building system rules documentation...');
    const systemRulesContent = buildSystemRulesContent(sortedSystemRules);
    console.log(`   ✅ System rules content built\n`);

    console.log('8️⃣  Writing to docs/system-rules.md...');
    fs.writeFileSync(systemRulesPath, systemRulesContent, 'utf8');
    console.log(`   ✅ Written to ${systemRulesPath}\n`);
  }

  console.log('✨ README generation complete!\n');
  console.log('Rules included in README:');
  sortedRules.forEach(rule => {
    const betaLabel = rule.isBeta ? ' [BETA]' : '';
    console.log(`   - ${rule.title}${betaLabel}`);
  });

  if (sortedSystemRules.length > 0) {
    console.log('\nSystem rules (in docs/system-rules.md):');
    sortedSystemRules.forEach(rule => {
      const betaLabel = rule.isBeta ? ' [BETA]' : '';
      console.log(`   - ${rule.title}${betaLabel}`);
    });
  }
} catch (error) {
  console.error('❌ Error generating README:', error.message);
  console.error(error.stack);
  process.exit(1);
}
