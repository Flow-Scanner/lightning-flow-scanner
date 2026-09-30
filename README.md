<p align="center">
  <a href="https://www.npmjs.com/package/lightning-flow-scanner">
    <img src="https://badgen.net/npm/v/lightning-flow-scanner?label=CLI" alt="CLI version">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=ForceConfigControl.lightning-flow-scanner-vsx">
    <img src="https://badgen.net/vs-marketplace/v/ForceConfigControl.lightning-flow-scanner-vsx?label=VS%20Code" alt="VS Code version">
  </a>
  <a href="https://github.com/marketplace/actions/lightning-flow-scan">
    <img src="https://badgen.net/badge/Action/v3.7.4/blue" alt="GitHub Action version">
  </a>
  <a href="https://appexchange.salesforce.com/appxListingDetail?listingId=80d6caf3-d4a8-41ec-b48e-da1fe3457e98">
    <img src="https://badgen.net/github/tag/Flow-Scanner/lightning-flow-scanner-app?label=App" alt="Salesforce App version">
  </a>
    <a href="https://www.npmjs.com/package/@flow-scanner/lightning-flow-scanner-core">
    <img src="https://badgen.net/npm/v/@flow-scanner/lightning-flow-scanner-core?label=Core" alt="Core version">
  </a>
  <a href="https://github.com/Flow-Scanner/lightning-flow-scanner/stargazers">
    <img src="https://badgen.net/github/stars/Flow-Scanner/lightning-flow-scanner?label=Stargazers" alt="GitHub stars">
  </a>
</p>

<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/docs/media/banner.png" alt="Lightning Flow Scanner" width="43%" />
  </a>
</p>

<p align="center"><i>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize Salesforce Flows</i></p>

<p align="center">Also available in the <a href="https://chromewebstore.google.com/detail/salesforce-inspector-relo/hpijlohoihegkfehhibggnkbjhoemldh"><b>Salesforce Inspector Reloaded</b></a> extension and <a href="https://appexchange.salesforce.com/appxListingDetail?listingId=a0N4V00000HA0X2UAL"><b>Org Check</b></a> app</p>

---

## Table of contents

- **[Default Rules](#default-rules)**
  - [Problems](#problems)
  - [Suggestions](#suggestions)
  - [Layout](#layout)
- **[Configuration](#configuration)**
  - [Configure Rules](#configure-rules)
  - [Define Exceptions](#define-exceptions)
  - [Exclude Flows](#exclude-flows)
  - [Scan Options](#scan-options)
- **[Installation](#installation)**
  - [Distributions](#distributions)
  - [CICD Templates](#cicd-templates)
- **[Quick Start](#quick-start)**
- **[Development](#development)**

---

## Default Rules

<p>📌<strong>Tip:</strong> To link directly to a specific rule, use the full GitHub anchor link format. Example:</p>
<p><em><a href="https://flow-scanner.github.io/lightning-flow-scanner/#unsafe-running-context">https://flow-scanner.github.io/lightning-flow-scanner/#unsafe-running-context</a></em></p>

> Want to help improve this project? See our [Contributing Guidelines](CONTRIBUTING.md)

<!-- START GENERATED_RULES -->

---

### Problems

These rules detect anti-patterns and unsafe practices in your Flows that could break functionality, compromise security, or cause deployment failures.

#### DML Statement In A Loop
Executing DML operations (insert, update, delete) inside a loop is a high-risk anti-pattern that frequently causes governor limit exceptions. All database operations should be collected and executed once, outside the loop.

**Rule ID:** `dml-in-loop`
**Class Name:** _[DMLStatementInLoop](packages/core/src/main/rules/DMLStatementInLoop.ts)_
**Severity:** 🔴 *Error*

#### Hardcoded Id
Avoid hard-coding record IDs, as they are unique to a specific org and will not work in other environments. Instead, store IDs in variables—such as merge-field URL parameters or a **Get Records** element—to make the Flow portable, maintainable, and flexible.

**Rule ID:** `hardcoded-id`
**Class Name:** _[HardcodedId](packages/core/src/main/rules/HardcodedId.ts)_
**Severity:** 🔴 *Error*

#### Hardcoded Secret ![Beta](https://img.shields.io/badge/status-beta-yellow)
Avoid hardcoding secrets, API keys, tokens, or credentials in Flows. These should be stored securely in Named Credentials, Custom Settings, Custom Metadata, or external secret management systems.

**Rule ID:** `hardcoded-secret`
**Class Name:** _[HardcodedSecret](packages/core/src/main/rules/HardcodedSecret.ts)_
**Severity:** 🔴 *Error*

#### Hardcoded Url
Avoid hard-coding URLs, as they may change between environments or over time. Instead, store URLs in variables or custom settings to make the Flow adaptable, maintainable, and environment-independent.

**Rule ID:** `hardcoded-url`
**Class Name:** _[HardcodedUrl](packages/core/src/main/rules/HardcodedUrl.ts)_
**Severity:** 🔴 *Error*

#### Process Builder
Process Builder is retired. Continuing to use it increases maintenance overhead and risks future compatibility issues. Migrating automation to Flow reduces risk and improves maintainability.

**Rule ID:** `process-builder-usage`
**Class Name:** _[ProcessBuilder](packages/core/src/main/rules/ProcessBuilder.ts)_
**Severity:** 🔴 *Error*

#### SOQL Query In A Loop
Running SOQL queries inside a loop can rapidly exceed query limits and severely degrade performance. Queries should be executed once, with results reused throughout the loop.

**Rule ID:** `soql-in-loop`
**Class Name:** _[SOQLQueryInLoop](packages/core/src/main/rules/SOQLQueryInLoop.ts)_
**Severity:** 🔴 *Error*

#### Unsafe Running Context
Flows configured to run in System Mode without Sharing grant access to all data, bypassing user permissions. Avoid this setting to prevent security risks and protect sensitive data.

**Rule ID:** `unsafe-running-context`
**Class Name:** _[UnsafeRunningContext](packages/core/src/main/rules/UnsafeRunningContext.ts)_
**Severity:** 🔴 *Error*

#### Duplicate DML Operation
When a Flow performs database operations across multiple screens, users navigating backward can cause the same actions to run multiple times. To prevent unintended changes, either restrict backward navigation or redesign the Flow so database operations execute in a single, forward-moving step.

**Rule ID:** `duplicate-dml`
**Class Name:** _[DuplicateDMLOperation](packages/core/src/main/rules/DuplicateDMLOperation.ts)_
**Severity:** 🟡 *Warning*

#### Missing Fault Path
Elements that can fail should include a Fault Path to handle errors gracefully. Without it, failures show generic errors to users. Fault Paths improve reliability and user experience.

**Rule ID:** `missing-fault-path`
**Class Name:** _[MissingFaultPath](packages/core/src/main/rules/MissingFaultPath.ts)_
**Severity:** 🟡 *Warning*

#### Missing Null Handler
Get Records operations return null when no data is found. Without handling these null values, Flows can fail or produce unintended results. Adding a null check improves reliability and ensures the Flow behaves as expected.

**Rule ID:** `missing-null-handler`
**Class Name:** _[MissingNullHandler](packages/core/src/main/rules/MissingNullHandler.ts)_
**Severity:** 🟡 *Warning*

#### Recursive After Update
After-save Flows that update the same record can trigger recursion, causing unintended behavior or performance issues. Avoid updating the triggering record in after-save Flows; use before-save Flows instead to prevent recursion.

**Rule ID:** `recursive-record-update`
**Class Name:** _[RecursiveAfterUpdate](packages/core/src/main/rules/RecursiveAfterUpdate.ts)_
**Severity:** 🟡 *Warning*

---

### Suggestions

These rules highlight areas where Flows can be improved. Following them increases reliability and long-term maintainability.

#### Action Call In A Loop
Repeatedly invoking Apex actions inside a loop can exhaust governor limits and lead to performance issues. Where possible, bulkify your logic by moving the action call outside the loop and passing a collection variable instead.

**Rule ID:** `action-call-in-loop`
**Class Name:** _[ActionCallsInLoop](packages/core/src/main/rules/ActionCallsInLoop.ts)_
**Severity:** 🟡 *Warning*

#### Get Record All Fields
Avoid using Get Records to retrieve all fields unless necessary. This improves performance, reduces processing time, and limits exposure of unnecessary data.

**Rule ID:** `get-record-all-fields`
**Class Name:** _[GetRecordAllFields](packages/core/src/main/rules/GetRecordAllFields.ts)_
**Severity:** 🟡 *Warning*

#### Inactive Flow
Inactive Flows should be deleted or archived to reduce risk. Even when inactive, they can cause unintended record changes during testing or be activated as subflows. Keeping only active, relevant Flows improves safety and maintainability.

**Rule ID:** `inactive-flow`
**Class Name:** _[InactiveFlow](packages/core/src/main/rules/InactiveFlow.ts)_
**Severity:** 🟡 *Warning*

#### Invalid API Version ![Auto-Fix](https://img.shields.io/badge/-auto--fix-green)
Flows running on outdated API versions may behave inconsistently when newer platform features or components are used. From API version 50.0 onward, the API Version attribute explicitly controls Flow runtime behavior. Keeping Flows aligned with a supported API version helps prevent compatibility issues and ensures predictable execution.

**Rule ID:** `invalid-api-version`
**Class Name:** _[APIVersion](packages/core/src/main/rules/APIVersion.ts)_
**Severity:** 🟡 *Warning*

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| expression | expression | `>= 50` | Comparison expression for API version (e.g., `>= 58`, `< 50`, `=== 60`) |


#### Missing Filter Record Trigger ![Beta](https://img.shields.io/badge/status-beta-yellow)
Record-triggered Flows without filters on changed fields or entry conditions execute on every record change. Adding filters ensures the Flow runs only when needed, improving performance.

**Rule ID:** `missing-record-trigger-filter`
**Class Name:** _[MissingFilterRecordTrigger](packages/core/src/main/rules/MissingFilterRecordTrigger.ts)_
**Severity:** 🟡 *Warning*

#### Same Record Field Updates
Before-save Flows can safely update the triggering record directly via $Record, applying changes efficiently without extra DML operations. Using before-save updates improves performance

**Rule ID:** `same-record-field-updates`
**Class Name:** _[SameRecordFieldUpdates](packages/core/src/main/rules/SameRecordFieldUpdates.ts)_
**Severity:** 🟡 *Warning*

#### Cognitive Complexity ![Beta](https://img.shields.io/badge/status-beta-yellow)
Flows with deeply nested loops and decisions are hard to understand. Unlike cyclomatic complexity which counts paths, cognitive complexity penalizes nesting depth. Consider extracting nested logic into subflows.

**Rule ID:** `cognitive-complexity`
**Class Name:** _[CognitiveComplexity](packages/core/src/main/rules/CognitiveComplexity.ts)_
**Severity:** 🔵 *Note*

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| threshold | number | `15` | Maximum cognitive complexity score before triggering a violation |


#### Excessive Cyclomatic Complexity
High numbers of loops and decision elements increase a Flow's cyclomatic complexity. To maintain simplicity and readability, consider using subflows or splitting a Flow into smaller, ordered Flows.

**Rule ID:** `excessive-cyclomatic-complexity`
**Class Name:** _[CyclomaticComplexity](packages/core/src/main/rules/CyclomaticComplexity.ts)_
**Severity:** 🔵 *Note*

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| threshold | number | `25` | Maximum cyclomatic complexity score before triggering a violation |


#### Missing Trigger Order
Record-triggered Flows without a specified Trigger Order may execute in an unpredictable sequence. Setting a Trigger Order ensures your Flows run in the intended order.

**Rule ID:** `unspecified-trigger-order`
**Class Name:** _[TriggerOrder](packages/core/src/main/rules/TriggerOrder.ts)_
**Severity:** 🔵 *Note*

#### Record ID as String ![Beta](https://img.shields.io/badge/status-beta-yellow)
Flows that use a String variable for a record ID instead of receiving the full record introduce unnecessary complexity and additional Get Records queries. Using the complete record simplifies the Flow and improves performance.

**Rule ID:** `record-id-as-string`
**Class Name:** _[RecordIdAsString](packages/core/src/main/rules/RecordIdAsString.ts)_
**Severity:** 🔵 *Note*

#### Transform Instead of Loop ![Beta](https://img.shields.io/badge/status-beta-yellow)
Loop elements that perform direct Assignments on each item can slow down Flows. Using Transform elements allows bulk operations on collections, improving performance and reducing complexity.

**Rule ID:** `transform-instead-of-loop`
**Class Name:** _[TransformInsteadOfLoop](packages/core/src/main/rules/TransformInsteadOfLoop.ts)_
**Severity:** 🔵 *Note*

---

### Layout

Focused on naming, documentation, and organization, these rules ensure Flows remain clear, easy to understand, and maintainable as automations grow.

#### Flow Naming Convention
Using clear and consistent Flow names improves readability, discoverability, and maintainability. A good naming convention helps team members quickly understand a Flow's purpose—for example, including a domain and brief description like Service_OrderFulfillment. Adopt a naming pattern that aligns with your organization's standards.

**Rule ID:** `invalid-naming-convention`
**Class Name:** _[FlowName](packages/core/src/main/rules/FlowName.ts)_
**Severity:** 🔴 *Error*

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| expression | expression | `[A-Za-z0-9]+_[A-Za-z0-9]+` | Regex pattern for valid Flow names |


#### Missing Flow Description
Flow descriptions are essential for documentation and maintainability. Include a description for each Flow, explaining its purpose and where it's used.

**Rule ID:** `missing-flow-description`
**Class Name:** _[FlowDescription](packages/core/src/main/rules/FlowDescription.ts)_
**Severity:** 🔴 *Error*

#### Missing Metadata Description ![Beta](https://img.shields.io/badge/status-beta-yellow)
Elements and metadata without a description reduce clarity and maintainability. Adding descriptions improves readability and makes your automation easier to understand.

**Rule ID:** `missing-metadata-description`
**Class Name:** _[MissingMetadataDescription](packages/core/src/main/rules/MissingMetadataDescription.ts)_
**Severity:** 🟡 *Warning*

#### Unclear API Name
Elements with unclear or duplicated API names, like Copy_X_Of_Element, reduce Flow readability. Make sure to update the API name when copying elements to keep your Flow organized.

**Rule ID:** `unclear-api-naming`
**Class Name:** _[CopyAPIName](packages/core/src/main/rules/CopyAPIName.ts)_
**Severity:** 🟡 *Warning*

#### Unreachable Element ![Auto-Fix](https://img.shields.io/badge/-auto--fix-green)
Unconnected elements never execute and add unnecessary clutter. Remove or connect unused Flow elements to keep Flows clean and efficient.

**Rule ID:** `unreachable-element`
**Class Name:** _[UnconnectedElement](packages/core/src/main/rules/UnconnectedElement.ts)_
**Severity:** 🟡 *Warning*

#### Unused Variable ![Auto-Fix](https://img.shields.io/badge/-auto--fix-green)
Unused variables are never referenced and add unnecessary clutter. Remove them to keep Flows efficient and easy to maintain.

**Rule ID:** `unused-variable`
**Class Name:** _[UnusedVariable](packages/core/src/main/rules/UnusedVariable.ts)_
**Severity:** 🟡 *Warning*

#### Missing Auto Layout ![Auto-Fix](https://img.shields.io/badge/-auto--fix-green)
Auto-Layout automatically arranges and aligns Flow elements, keeping the canvas organized and easier to maintain. Enabling it saves time and improves readability.

**Rule ID:** `missing-auto-layout`
**Class Name:** _[AutoLayout](packages/core/src/main/rules/AutoLayout.ts)_
**Severity:** 🔵 *Note*

#### System (subcategory)

System rules are a subset of Layout rules that detect structural issues normally prevented by the Flow Builder UI. See [System Rules Documentation](docs/system-rules.md) for the full list.
<!-- END GENERATED_RULES -->

---

## Configuration

It is recommend to configure and define:

- The severity of violating any specific rule.
- Expressions used for rules, such as REGEX patterns and comparison operators.
- Any known exceptions that should be ignored during scanning.
- (Optional) Implement filters based on a severity **threshold** or **rule categories**.

Most distributions automatically load configuration from: 
- `.flow-scanner.yml`  
- `.flow-scanner.json`  
- `package.json` → `"flowScanner"` key

```json
{
  "rules": {
    // rule customizations (severity, expression, enabled, ...)
  },
  "exceptions": {
    // flow → rule → result suppressions
  },
  "threshold": "error",                    // only consider errors
  "categories": ["problem", "layout"]  // only run rules from these categories
}
```

### Configure Rules

By default, all default rules are executed. You can customize individual rules and override the rules to be executed without having to specify every rule. Below is a breakdown of the available attributes of rule configuration:

```json
{
  "rules": {
    "<RuleId>": {
      "severity": "<Severity>", // Override severity level
      "expression": "<Expression>", // Override rule expression
      "message": "<Message>", // Set custom message
      "messageUrl": "<URL>", // Set custom documentation URL
      "enabled": false, // Disable this rule
    }
  }
}
```

#### Configure Severity

Available values for severity are `error`, `warning` and `note`. If no severity is provided, a default value is applied. Configure the severity per rule as demonstrated below:

```json
{
  "rules": {
    "record-id-as-string": {
      "severity": "warning",
    },
    "unclear-api-naming": {
      "severity": "error",
    }
  }
}
```

#### Customize Rules

Some rules are configurable and allow overriding their default expressions, or setting a threshold as shown in the examples below.

```json
{
  "rules": {
    "invalid-api-version": {
      "expression": "===58" // comparison expression
    },
    "invalid-naming-convention": {
      "expression": "[A-Za-z0-9]" // regular expression
    },
    "excessive-cyclomatic-complexity": {
      "threshold": 10 // threshold
    }
  }
}
```

#### Customize Rule Messages

If not provided, `message` shows the standard rule summary and `messageUrl` links to the README; providing either overrides the default behavior.

```json
{
  "rules": {
    "dml-in-loop": {
      "message": "Avoid DML inside loops. Bulkify operations instead.",
      "messageUrl": "https://internal.docs.company.com/salesforce/flow-dml-best-practices"
    }
  }
}
```

#### Disable Rules

To disable a rule, set `"enabled": false` as shown below:

```json
{
  "rules": {
    "dml-in-loop": {
      "enabled": false
    }
  }
}
```

### Define Exceptions

Defining exceptions allows you to exclude specific scenarios from rule enforcement. Exceptions can be specified at the flow, rule, or result level to provide fine-grained control. Below is a breakdown of the available attributes of exception configuration:

```json
{
  "exceptions": {
    "<FlowName>": {
      "<RuleId>": [
        "<ResultName>", // Suppress a result
        "*", // Wildcard to suppress all results
        ...
      ]
    },
    ...
  }
}
```

_Example_

```json
{
  "exceptions": {
    "MyFlow": {
      "hardcoded-id": ["Old_Lookup_1"],
      "missing-null-handler": ["*"]
    }
  }
}
```

### Exclude Flows

#### Exclude by File Path (Node.js only)

Use glob patterns to exclude flows based on their file system location. This is useful for excluding entire directories or specific name patterns:

```json
{
  "ignore": [
    "**/testing/**",
    "**/*_Deprecated.flow-meta.xml"
  ]
}
```

**Environment compatibility**: requires Node.js(file system access) and is not available when using the Core Library in browser/web environments.

#### Exclude by Flow API Name (Browser-compatible)

Exclude specific flows by their unique API names, regardless of their location. This is particularly useful for:
- Excluding specific flows without knowing their exact file path
- Working with metadata API deployments where directory structures may vary
- More precise control than path-based patterns

```json
{
  "ignoreFlows": [
    "My_Legacy_Flow",
    "Temporary_Test_Flow",
    "Deprecated_Process_Builder"
  ]
}
```

**Environment compatibility**: works in **all environments** including Node.js and browser/web distributions, as it operates on parsed flow data rather than file system paths.

### Scan Options

#### Severity Threshold
Only report on violations at or above a chosen severity level:
```json
{ "threshold": "error" }
```

#### Filter by category
Restrict the scan to specific categories of rules:
```json
{ "categories": ["problem", "layout"] }
```

#### Beta Mode

New rules are introduced in Beta mode before being added to the default ruleset. To include current Beta rules, enable the optional betamode parameter in your configuration:

```json
{ "betaMode": true }
```

#### Rule Mode

By default, Lightning Flow Scanner runs **all** default rules and merges any custom configurations you provide.  If instead, you want to run **only** the rules you explicitly specify, use:
```json
{ "ruleMode": "isolated" }
```

## Installation

### Distributions

| Distribution                                      | Best for                                      | Install                                                                                           |
|----------------------------------------------------------------|-----------------------------------------------|---------------------------------------------------------------------------------------------------------|
| **[Salesforce App](https://appexchange.salesforce.com/appxListingDetail?listingId=80d6caf3-d4a8-41ec-b48e-da1fe3457e98)** | Run scans directly inside a Salesforce org  | `sf package install --package 04tgK0000008CLlQAM` |
| **[Salesforce CLI Plugin](https://www.npmjs.com/package/lightning-flow-scanner)** | Local development, scratch orgs, CI/CD        | `sf plugins install lightning-flow-scanner`                                                             |
| **[VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ForceConfigControl.lightning-flow-scanner-vsx)** | Real-time scanning inside VS Code             | `code --install-extension ForceConfigControl.lightning-flow-scanner-vsx`                               |
| **[GitHub Action](https://github.com/marketplace/actions/lightning-flow-scan)** | Native PR checks        | `uses: Flow-Scanner/lightning-flow-scanner@main` |
| **[Core Library](https://www.npmjs.com/package/@flow-scanner/lightning-flow-scanner-core)** (Node.js + Browser) | Custom tools, scripts, extensions, web apps   | `npm install -g @flow-scanner/lightning-flow-scanner-core`                                                 |
| **[Regex Scanner](https://www.npmjs.com/package/@flow-scanner/regex-scanner)** |  Regex-based scanning   | `npm install -g @flow-scanner/regex-scanner`   

**Privacy:** Zero user data collected. All processing is client-side. → See our [Security Policy](SECURITY.md).

### CICD Templates
Ready-to-use CI/CD templates.

| Platform       | Type                     | Link |
|----------------|-----------------------------------|------|
| [Azure DevOps](docs/azure-templates.md)   | Full Project Scan                 | [`azure-pipelines-flow-FullScan.yml`](docs/templates/azure-devops/azure-pipelines-flow-FullScan.yml) |
| [Azure DevOps](docs/azure-templates.md)   | Change-Based Scan                 | [`azure-pipelines-flow-changedFiles.yml`](docs/templates/azure-devops/azure-pipelines-flow-changedFiles.yml) |

## Quick Start

### Salesforce CLI Plugin

Use `lightning-flow-scanner` in the Salesforce CLI:

```bash
sf flow:scan # Scan flows in the current directory
sf flow:scan --sarif > report.sarif # Export scan results as SARIF
sf flow scan --csv > results.csv # Export scan results as CSV
sf flow doc > flow-docs.md # Generate flow documentation (Single markdown file)
sf flow doc --output flow-docs --separate # Generate one Markdown file per flow
sf flow:fix -d src/force-app # Fix flows in a specific directory
```

For full details, see the [CLI Readme](packages/cli/README.md).

### VS Code Extension
Use our side bar or the **Command Palette** and type `flow scanner` to see the list of all available commands.

* `Configure Scanner` - Set up rules in `.flow-scanner.yml`
* `Scan Flows` - Analyze a directory or selected flow files
* `Fix Flows` - Automatically apply available fixes
* `Generate Flow Documentation` - Generate flow documentation
* `Open Scanner Documentation` - Open the rules reference guide

For full details, see the [VSX Readme](packages/vsx/README.md).

### GitHub Action
Add a GitHub workflow file `.github/workflows/scan-flows.yml` to detect issues directly in pull requests:

```yaml
- name: Lightning Flow Scan
  id: flowscanner
  uses: Flow-Scanner/lightning-flow-scanner@main
  with:
    sarif-only: true  # Strict mode for PRs

- name: Upload SARIF to Code Scanning
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: ${{ steps.flowscanner.outputs.sarifPath }}
```

For full details, see the [Action Readme](packages/action/README.md).

### Core Module
Use `lightning-flow-scanner-core` as a Node.js/browser dependency:

```js
// Basic
import { parse, scan } from "@flow-scanner/lightning-flow-scanner-core";
parse("flows/*.xml").then(scan);

// Get SARIF output (e.g. for GitHub Code Scanning)
import { parse, scan, exportSarif } from "@flow-scanner/lightning-flow-scanner-core";
parse("flows/**/*.flow-meta.xml").then(scan).then(exportSarif)
  // .then(sarif => fs.writeFile("results.sarif", sarif))

// Generate Markdown documentation with Mermaid flow diagrams
import { parse, exportDiagram } from "@flow-scanner/lightning-flow-scanner-core";
parse("flows/**/*.flow-meta.xml").then(exportDiagram)
  // .then(md => fs.writeFile("flow-docs.md", md))

// Browser Usage (Tooling API)
const { Flow, scan } = window.lightningflowscanner;
const metadataRes = await conn.tooling.query(`SELECT Id, FullName, Metadata FROM Flow`);
const results = scan(
  metadataRes.records.map((r) => ({
    uri: `/services/data/v60.0/tooling/sobjects/Flow/${r.Id}`,
    flow: new Flow(r.FullName, r.Metadata),
  })) //, optionsForScan
);
```

For more on Programmatic API, types, and advanced usage of `@flow-scanner/lightning-flow-scanner-core`, see the [Core Library Reference](docs/core-reference.md).

## Development

> This project optionally uses [Volta](https://volta.sh) to guarantee the exact same Node.js and tool versions for every contributor.
>
> MacOs/Linux:
> ```sh
> curl https://get.volta.sh | bash
> ```
> Windows:
> ```sh
> winget install Volta.Volta
> ```
> Volta will automatically install and lock the tool versions defined in `package.json`.

1. Clone the repository

   ```bash
   git clone https://github.com/Flow-Scanner/lightning-flow-scanner.git
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Compile:

   ```bash
   pnpm run build
   ```

   To compile just the core package::
   ```bash
   pnpm build:core
   ```

4. Run tests:

   ```bash
   pnpm test
   ```

    Or to test a new version of the core:
    ```bash
    pnpm test:core
    ```

5. Linking the core module locally(Optional):

   To link the module, run:

   ```bash
   pnpm link --global @flow-scanner/lightning-flow-scanner-core
   ```

   You can now do Ad-Hoc Testing with node:

   ```bash
   node -i -e "import('@flow-scanner/lightning-flow-scanner-core').then(m => { Object.assign(global, m.default ? m.default : m); console.log('✅ Core loaded! Try: await parse(...), scan(...), etc.'); })"
   ```

    Or test in a dependent project with `npm link @flow-scanner/lightning-flow-scanner-core`

6. Deploy Demo Flows (Optional):

   ```bash
   sf project deploy start
   ```

   Navigate to the [Demo Readme](example-flows/README.md) for full details

7. Create a standalone UMD Module(Optional):

   ```bash
     pnpm dist
   ```
   This creates UMD at `dist/lightning-flow-scanner-core.umd.js`.
