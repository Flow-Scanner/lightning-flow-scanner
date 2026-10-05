# Subflow Resolution

When a Salesforce Flow calls another flow using a **Subflow** element, the scanner needs access to the referenced flow's metadata to perform complete analysis (e.g., checking if the subflow has its own issues, calculating total complexity across the call chain, etc.).

This document explains how to enable subflow resolution in different environments.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Usage by Environment](#usage-by-environment)
  - [Node.js / CLI](#nodejs--cli)
  - [VS Code Extension](#vs-code-extension)
  - [Browser / UMD](#browser--umd)
  - [MCP Server](#mcp-server)
  - [GitHub Action](#github-action)
- [API Reference](#api-reference)

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Package (UMD)                       │
│                                                             │
│  SubflowResolver (interface)                                │
│  ├── NoOpResolver      - Default, no resolution             │
│  └── PreloadedResolver - For pre-fetched flow data          │
│                                                             │
│  Flow helpers:                                              │
│  ├── flow.getSubflowNodes()  - Get subflow elements         │
│  ├── flow.getSubflowNames()  - Get referenced flow names    │
│  └── flow.hasSubflows()      - Check if flow uses subflows  │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
          ┌───────────────────┴───────────────────┐
          │                                       │
┌─────────┴─────────┐               ┌────────────┴────────────┐
│ FileSystemResolver│               │   Custom Resolvers      │
│ (CLI, VSX)        │               │   (MCP, Action, etc.)   │
│ Loads from disk   │               │   Use PreloadedResolver │
└───────────────────┘               └─────────────────────────┘
```

---

## Core Concepts

### SubflowResolver Interface

```typescript
interface SubflowResolver {
  // Resolve a single subflow by API name
  resolve(flowName: string): Promise<ResolvedSubflow>;

  // Resolve multiple subflows at once
  resolveMany(flowNames: string[]): Promise<Map<string, ResolvedSubflow>>;

  // Check if a subflow is available
  has(flowName: string): boolean;

  // Synchronous access to an already-loaded flow — this is what rules use
  // during check(), so cross-flow analysis only sees pre-loaded flows
  getSync?(flowName: string): Flow | undefined;
}

interface ResolvedSubflow {
  flowName: string;
  flow?: Flow;          // The resolved Flow object
  error?: string;       // Error message if resolution failed
  isManaged?: boolean;  // Whether flow is from a managed package
}
```

### Finding Subflow References

Before resolving subflows, you need to know which ones a flow references:

```typescript
import { Flow } from '@flow-scanner/lightning-flow-scanner-core';

const flow = new Flow('MyFlow', xmlData);

// Check if flow uses subflows
if (flow.hasSubflows()) {
  // Get unique subflow API names
  const subflowNames = flow.getSubflowNames();
  // Returns: ['Child_Flow_1', 'Child_Flow_2']

  // Get the actual subflow node elements (for detailed analysis)
  const subflowNodes = flow.getSubflowNodes();
  // Returns: FlowNode[] with subtype 'subflows'
}
```

---

## Usage by Environment

### Node.js / CLI

Use `FileSystemResolver` to automatically load subflows from the local filesystem:

```typescript
import {
  parse,
  scan
} from '@flow-scanner/lightning-flow-scanner-core';
import { FileSystemResolver } from 'lightning-flow-scanner';

async function scanWithSubflows(flowPaths: string[], projectRoot: string) {
  // 1. Create resolver pointing to your flows directory
  const resolver = await FileSystemResolver.create({
    searchPaths: [projectRoot + '/force-app/main/default/flows'],
    skipManaged: true,  // Skip namespace__FlowName (managed package flows)
  });

  // 2. Parse the flows you want to scan
  const parsedFlows = await parse(flowPaths);

  // 3. Scan with subflow resolution
  const results = scan(parsedFlows, {
    rules: {},
    subflowResolver: resolver,
  });

  return results;
}
```

---

### VS Code Extension

The VSX package includes its own `FileSystemResolver`:

```typescript
import { FileSystemResolver } from '../libs/FileSystemResolver';
import * as core from '@flow-scanner/lightning-flow-scanner-core';

async function scanFlowsWithSubflows(flowPaths: string[], workspaceRoot: string) {
  // Create resolver for the workspace
  const resolver = await FileSystemResolver.create({
    searchPaths: [workspaceRoot],
  });

  const parsed = await core.parse(flowPaths);
  const results = core.scan(parsed, {
    rules: config.rules,
    subflowResolver: resolver,
  });

  return results;
}
```

---

### Browser / UMD

In browser environments, you can't access the filesystem. Use `PreloadedResolver` with flows fetched via API:

```html
<script src="lightning-flow-scanner-core.umd.js"></script>
<script>
const { PreloadedResolver, Flow, scan } = lightningflowscanner;

async function scanFlowsInBrowser(flowDataArray) {
  // 1. Create resolver
  const resolver = new PreloadedResolver();

  // 2. Add all available flows (main flows + potential subflows)
  for (const data of flowDataArray) {
    // data = { apiName: 'My_Flow', xml: '<Flow>...</Flow>' }
    resolver.addFlowFromXml(data.apiName, data.xml);
  }

  // 3. Parse the specific flows you want to scan
  const flowsToScan = flowDataArray
    .filter(d => d.shouldScan)
    .map(d => new Flow(d.apiName, d.xml));

  // 4. Scan with resolver
  const results = scan(
    flowsToScan.map(f => ({ flow: f })),
    { subflowResolver: resolver }
  );

  return results;
}
</script>
```

---

### MCP Server

When building an MCP server that scans Salesforce flows, use `PreloadedResolver` with data from Salesforce APIs:

```typescript
import {
  Flow,
  PreloadedResolver,
  scan,
} from '@flow-scanner/lightning-flow-scanner-core';

// Example: MCP tool handler for scanning flows
async function handleScanFlows(connection: SalesforceConnection, flowNames: string[]) {
  // 1. Fetch flow metadata from Salesforce
  const flowRecords = await connection.metadata.read('Flow', flowNames);

  // 2. Create resolver with all fetched flows
  const resolver = new PreloadedResolver();

  for (const record of flowRecords) {
    const flow = new Flow(record.fullName, record);
    resolver.addFlow(record.fullName, flow, {
      isManaged: record.namespacePrefix != null,
    });
  }

  // 3. Identify which subflows are referenced but not yet loaded
  const mainFlows = flowNames.map(name => resolver.resolve(name));
  const allSubflowNames = new Set<string>();

  for (const { flow } of await Promise.all(mainFlows)) {
    if (flow) {
      for (const name of flow.getSubflowNames()) {
        if (!resolver.has(name)) {
          allSubflowNames.add(name);
        }
      }
    }
  }

  // 4. Fetch missing subflows (if any)
  if (allSubflowNames.size > 0) {
    const subflowRecords = await connection.metadata.read('Flow', [...allSubflowNames]);
    for (const record of subflowRecords) {
      resolver.addFlow(record.fullName, new Flow(record.fullName, record));
    }
  }

  // 5. Scan with full subflow resolution
  const resolved = await Promise.all(flowNames.map(name => resolver.resolve(name)));
  const parsedFlows = resolved
    .filter(r => r.flow)
    .map(r => ({ flow: r.flow }));

  return scan(parsedFlows, { subflowResolver: resolver });
}
```

**Using Salesforce Dependency API**

For more efficient subflow discovery, use the Dependency API:

```typescript
async function getFlowDependencies(connection: SalesforceConnection, flowId: string) {
  // Query MetadataComponentDependency for subflow references
  const query = `
    SELECT MetadataComponentName, RefMetadataComponentName
    FROM MetadataComponentDependency
    WHERE MetadataComponentType = 'Flow'
    AND RefMetadataComponentType = 'Flow'
    AND MetadataComponentId = '${flowId}'
  `;

  const result = await connection.tooling.query(query);
  return result.records.map(r => r.RefMetadataComponentName);
}
```

---

### GitHub Action

The GitHub Action fetches flows from the repository via GitHub API. To include subflow resolution:

```javascript
// In action.js - extending current implementation

const lfs_core = require("@flow-scanner/lightning-flow-scanner-core");
const { PreloadedResolver, Flow } = lfs_core;

async function run() {
  // ... existing code to fetch flow files from GitHub ...

  // Create resolver and add all flows
  const resolver = new PreloadedResolver();

  for (const pFlow of pFlows) {
    if (pFlow.flow) {
      resolver.addFlow(pFlow.flow.name, pFlow.flow);
    }
  }

  // Now scan with subflow resolution enabled
  const scanResults = lfs_core.scan(pFlows, {
    ...config,
    subflowResolver: resolver,
  });

  // ... rest of existing code ...
}
```

**Note:** The Action already fetches all flow files in the repository/PR, so all referenced subflows should already be available. You just need to wire up the resolver.

---

## API Reference

### PreloadedResolver

```typescript
class PreloadedResolver implements SubflowResolver {
  constructor(initialFlows?: Map<string, Flow>);

  // Add a single flow
  addFlow(flowName: string, flow: Flow, options?: { isManaged?: boolean }): void;

  // Add multiple flows
  addFlows(flows: Map<string, Flow>): void;

  // Add flow from parsed XML data
  addFlowFromXml(flowName: string, xmlData: unknown, options?: { isManaged?: boolean }): void;

  // Remove a flow
  removeFlow(flowName: string): boolean;

  // Clear all flows
  clear(): void;

  // Get number of loaded flows
  get size(): number;

  // Get all flow names
  getFlowNames(): string[];

  // SubflowResolver interface
  resolve(flowName: string): Promise<ResolvedSubflow>;
  resolveMany(flowNames: string[]): Promise<Map<string, ResolvedSubflow>>;
  has(flowName: string): boolean;
}
```

### FileSystemResolver (Node.js only)

The shared implementation lives in core; the CLI and VS Code extension each
wrap it with their own file-discovery (glob) strategy via the `findFlowFiles`
option.

```typescript
class FileSystemResolver implements SubflowResolver {
  // Create with options
  static create(options: FileSystemResolverOptions): Promise<FileSystemResolver>;

  // Get available flow names
  getAvailableFlows(): string[];

  // Number of indexed flows
  get size(): number;

  // Number of loaded (cached) flows
  get loadedCount(): number;

  // Clear loaded cache (keeps index)
  clearCache(): void;

  // Rebuild index from filesystem
  refresh(): Promise<void>;

  // SubflowResolver interface
  resolve(flowName: string): Promise<ResolvedSubflow>;
  resolveMany(flowNames: string[]): Promise<Map<string, ResolvedSubflow>>;
  has(flowName: string): boolean;
  getSync(flowName: string): Flow | undefined;
}

interface FileSystemResolverOptions {
  searchPaths: string[];      // Directories to search
  ignorePatterns?: string[];  // Glob patterns to ignore
  eager?: boolean;            // Load all flows immediately (default: true)
  skipManaged?: boolean;      // Skip ns__FlowName flows (default: true)
}
```

### Flow Subflow Helpers

```typescript
class Flow {
  // Get all subflow node elements
  getSubflowNodes(): FlowNode[];

  // Get unique referenced subflow API names
  getSubflowNames(): string[];

  // Check if flow uses any subflows
  hasSubflows(): boolean;
}
```

---

## Recursive Subflow Resolution

Subflow chains can be deeply nested (Flow A → Flow B → Flow C → ...). The scanner **automatically handles recursive resolution** when checking for violations in loops.

### How It Works

When scanning a flow with a loop that calls a subflow:

1. The scanner checks the immediate subflow for violations
2. If that subflow calls other subflows, it recursively checks those too
3. Circular references are detected and handled (no infinite loops)
4. The violation is reported on the **original subflow call** in the loop

### Example: Nested Chain Detection

```
Parent Flow (has loop)
  └── Loop
        └── calls Middle_Flow
                    └── calls Child_Flow
                              └── DML Operation ← VIOLATION DETECTED!
```

**The violation carries the full call chain — flat, at the top level:**
```typescript
{
  name: "Call_Middle_Flow",              // The subflow call in the loop
  referencedFlow: "Child_Flow",          // Flow containing the violation
  referencedElement: "Create_Record",
  referencedType: "recordCreates",
  callChain: ["Middle_Flow", "Child_Flow"]  // Full path
}
```

### Browser/MCP: Pre-loading the Dependency Tree

**Important:** For recursive resolution to work, you must pre-load the **entire dependency tree** into the resolver.

```typescript
import { PreloadedResolver, Flow } from '@flow-scanner/lightning-flow-scanner-core';

// Method 1: Pre-load all flows in the org/project
const resolver = new PreloadedResolver();
for (const flowData of allFlowsFromSalesforce) {
  resolver.addFlowFromXml(flowData.apiName, flowData.metadata);
}

// Method 2: Recursively fetch dependencies before scanning
async function loadFlowWithDependencies(
  connection: SalesforceConnection,
  flowName: string,
  resolver: PreloadedResolver,
  loaded: Set<string> = new Set()
): Promise<void> {
  if (loaded.has(flowName)) return; // Prevent cycles
  loaded.add(flowName);

  // Fetch and add the flow
  const flowData = await connection.metadata.read('Flow', [flowName]);
  if (!flowData[0]) return;

  const flow = new Flow(flowName, flowData[0]);
  resolver.addFlow(flowName, flow);

  // Recursively load referenced subflows
  for (const subflowName of flow.getSubflowNames()) {
    await loadFlowWithDependencies(connection, subflowName, resolver, loaded);
  }
}

// Usage
const resolver = new PreloadedResolver();
await loadFlowWithDependencies(connection, "Main_Flow", resolver);
const results = scan([...], { subflowResolver: resolver });
```

### Using Salesforce Dependency API (Recommended)

For efficiency, query all dependencies upfront:

```typescript
async function loadFlowDependencyTree(
  connection: SalesforceConnection,
  rootFlowNames: string[]
): Promise<PreloadedResolver> {
  const resolver = new PreloadedResolver();
  const toLoad = new Set(rootFlowNames);
  const loaded = new Set<string>();

  while (toLoad.size > 0) {
    const batch = Array.from(toLoad).slice(0, 10); // API limit
    toLoad.clear();

    // Fetch flows
    const flowData = await connection.metadata.read('Flow', batch);
    for (const data of flowData) {
      if (!data) continue;
      const flow = new Flow(data.fullName, data);
      resolver.addFlow(data.fullName, flow);
      loaded.add(data.fullName);

      // Queue referenced subflows
      for (const subflowName of flow.getSubflowNames()) {
        if (!loaded.has(subflowName)) {
          toLoad.add(subflowName);
        }
      }
    }
  }

  return resolver;
}
```

---

## System Rules

The scanner includes "system" category rules that detect issues prevented by the Flow Builder UI. These rules are valuable when XML files are edited directly (by AI, scripts, etc.) but are disabled by default for performance.

### Enabling System Rules

```typescript
const results = scan(parsedFlows, {
  systemRules: true,  // Enable system rules
  betaMode: true,     // Required for beta system rules
  subflowResolver: resolver,
});
```

> **Note:** System rules in beta require both `systemRules: true` AND `betaMode: true`.

### Available System Rules

| Rule ID | Description |
|---------|-------------|
| `unresolved-subflow` | Detects subflow references that cannot be resolved. Requires a `SubflowResolver` to be configured. |

### Use Cases

System rules are particularly useful when:
- AI tools are editing Flow XML directly
- Scripts are generating or modifying flows
- Performing validation in CI/CD pipelines
- Migrating flows between orgs

---

## Best Practices

1. **Pre-load All Dependencies**: For browser/MCP, load the complete subflow tree before scanning.

2. **Skip Managed Packages**: Enable `skipManaged: true` to avoid errors when managed package flows aren't accessible.

3. **Cache Resolver**: Create the resolver once and reuse it across multiple scan operations.

4. **Handle Missing Subflows**: The scanner gracefully handles missing flows - violations in unreachable subflows simply won't be detected.

5. **Keep Eager Loading On for Node.js**: `FileSystemResolver` pre-loads all flows by default (`eager: true`) because rules resolve subflows synchronously — with `eager: false`, cross-flow analysis silently finds nothing unless you call `loadAll()` before scanning:

```typescript
const resolver = await FileSystemResolver.create({
  searchPaths: ['/path/to/flows'],
  // eager defaults to true — only disable it if you call loadAll() yourself
});
```

6. **Enable System Rules for AI/Script Workflows**: When flows are edited outside Flow Builder, enable `systemRules: true` to catch issues that would normally be prevented by the UI.

## Browser / UMD environments (no filesystem)

`FileSystemResolver` is Node-only (it uses `fs`/`glob`). In a browser — for
example a Chrome extension integrating with Salesforce Inspector Reloaded — the
UMD build of core still performs all analysis, but flows must come from an
async source (an org's Tooling/Metadata API) rather than disk.

Because the rule engine resolves subflows **synchronously** (`getSync`), the
subflow dependency closure must be resolved **up front** into a
`PreloadedResolver`. `buildResolver(roots, source)` does exactly this: it walks
the transitive `<subflows>` references breadth-first (deduped and cycle-safe),
fetching each referenced flow through a source you provide, and returns an eager
resolver ready to pass into `scan()`.

```typescript
import { parseFlowXml, buildResolver, scan, parse } from
  "@flow-scanner/lightning-flow-scanner-core";

// 1. A source that fetches one flow's XML from the org and parses it (no fs).
const orgSource = async (flowName: string) => {
  const xml = await fetchFlowXmlFromOrg(flowName); // your Tooling API call
  return xml ? parseFlowXml(flowName, xml) : undefined;
};

// 2. The root flows the user is scanning (already parsed to Flow objects).
const roots = rootFlows; // Flow[]

// 3. Resolve the subflow closure into an eager, synchronous-capable resolver.
const subflowResolver = await buildResolver(roots, orgSource);

// 4. Scan with cross-flow analysis enabled.
const results = scan(
  roots.map((flow) => ({ flow })),
  { rules: {}, betaMode: true, subflowResolver }
);
```

Notes:
- `buildResolver` fetches only the flows actually referenced (transitively), not
  every flow in the org — one source call per referenced flow, deduped.
- Managed-package subflows (API names containing `__`) are skipped by default
  and can't usually be retrieved anyway; the `UnresolvedSubflow` rule surfaces
  anything that can't be resolved.
- `maxDepth` caps how many subflow hops are followed if you need to bound work.
