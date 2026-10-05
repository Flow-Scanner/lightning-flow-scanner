# System Rules

System rules detect issues that are normally prevented by the Flow Builder UI. These rules are valuable when Flow XML files are edited directly by AI tools, scripts, or other automated processes.

## Enabling System Rules

System rules are disabled by default. To opt in:

```yaml
# .flow-scanner.yml
systemRules: true
```

Or programmatically:

```typescript
import { scan } from '@flow-scanner/lightning-flow-scanner-core';

const results = scan(parsedFlows, {
  systemRules: true,
  betaMode: true    // Required for beta system rules
});
```

## Use Cases

- **AI-assisted development**: When AI tools edit Flow XML directly
- **Scripted modifications**: Automated flow generation or transformation
- **Migration scenarios**: Validate flows moved between orgs

## Available Rules

### Missing Start Reference ![Beta](https://img.shields.io/badge/status-beta-yellow)
When a flow has no start reference.

**Rule ID:** `missing-start-reference`
**Class Name:** _[MissingStartReference](../packages/core/src/main/rules/MissingStartReference.ts)_
**Severity:** 🔴 *Error*

---

*This document is auto-generated. Do not edit manually.*
