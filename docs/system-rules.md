# System Rules

System rules detect issues that are normally prevented by the Flow Builder UI. These rules are valuable when Flow XML files are edited directly by AI tools, scripts, or other automated processes.

## Disabling System Rules

System rules are enabled by default. To disable them for performance optimization:

```yaml
# .flow-scanner.yml
systemRules: false
```

Or programmatically:

```typescript
import { scan } from '@flow-scanner/lightning-flow-scanner-core';

const results = scan(parsedFlows, {
  systemRules: false
});
```

## Use Cases

- **AI-assisted development**: When AI tools edit Flow XML directly
- **Scripted modifications**: Automated flow generation or transformation
- **Migration scenarios**: Validate flows moved between orgs

## Available Rules

### Missing Start Reference
When a flow has no start reference.

**Rule ID:** `missing-start-reference`
**Class Name:** _[MissingStartReference](../packages/core/src/main/rules/MissingStartReference.ts)_
**Severity:** 🔴 *Error*

---

*This document is auto-generated. Do not edit manually.*
