<p align="center">
  <a href="https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/Flow-Scanner/lightning-flow-scanner?style=flat-square" alt="License">
  </a>
  <a href="https://github.com/Flow-Scanner/lightning-flow-scanner/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/Flow-Scanner/lightning-flow-scanner.svg?style=flat-square" alt="Contributors">
  </a>
  <a href="https://www.npmjs.com/package/@flow-scanner/lightning-flow-scanner-core">
    <img src="https://img.shields.io/npm/v/@flow-scanner/lightning-flow-scanner-core?label=core&style=flat-square" alt="Core version">
  </a>
  <a href="https://www.npmjs.com/package/lightning-flow-scanner">
    <img src="https://img.shields.io/npm/v/lightning-flow-scanner?label=cli&style=flat-square" alt="CLI version">
  </a>
  <a href="https://open-vsx.org/extension/ForceConfigControl/lightning-flow-scanner-vsx">
    <img src="https://img.shields.io/open-vsx/v/ForceConfigControl/lightning-flow-scanner-vsx?label=Open%20VSX&style=flat-square" alt="Open VSX">
  </a>
  <a href="https://github.com/Flow-Scanner/lightning-flow-scanner/stargazers">
    <img src="https://img.shields.io/github/stars/Flow-Scanner/lightning-flow-scanner?style=flat-square" alt="GitHub stars">
  </a>
  <a href="https://www.npmjs.com/package/lightning-flow-scanner-core">
    <img src="https://img.shields.io/badge/downloads-510k%2B-success?style=flat-square" alt="Total Downloads">
  </a>
</p>

<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/docs/media/banner.png" alt="Lightning Flow Scanner" width="43%" />
  </a>
</p>

<p align="center"><i>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize Salesforce Flows</i></p>


<p align="center">
  <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/docs/media/vsx.gif" alt="Flow Overview"/>
</p>

---




## Table of contens

- **[Usage](#usage)**
- **[Default Rules](#default-rules)**
- **[Configuration](#configuration)**
- **[Installation](#installation)**
- **[Development](#development)**

---

## Usage

Lightning Flow Scanner VSX is plug-and-play. Open any project with flows and use our side bar or the **Command Palette** and type `flowscanner` to see the list of all available commands.

* `Configure Flow Scanner` - Set up rules in `.flow-scanner.yml`
* `Scan Flows` - Analyze a directory or selected flow files
* `Fix Flows` - Automatically apply available fixes
* `Flow Scanner Documentation` - Open the rules reference guide

**Privacy:** Zero user data collected. All processing is client-side. → See our [Security Policy](https://github.com/Flow-Scanner/lightning-flow-scanner-vsx?tab=security-ov-file).

| Extension Settings           | Description                                                         | Default Value |
| ---------------------------- | ------------------------------------------------------------------- | ------------- |
| `flowscanner.SpecifyFiles` | Set to true to select .Flow file paths instead of a root directory. | `false`     |

## Default Rules

<p>📌<strong>Tip:</strong> To link directly to a specific rule, use the full GitHub anchor link format. Example:</p>
<p><em><a href="https://github.com/Flow-Scanner/lightning-flow-scanner#unsafe-running-context">https://github.com/Flow-Scanner/lightning-flow-scanner#unsafe-running-context</a></em></p>

> Want to code a new rule? → See [How to Write a Rule](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/docs/write-a-rule.md)

### Action Calls In Loop  
_[ActionCallsInLoop](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/ActionCallsInLoop.ts)_ – To prevent exceeding Apex governor limits, it is advisable to consolidate and bulkify your apex calls, utilizing a single action call containing a collection variable at the end of the loop.  
**Severity:** 🔴 *Error*

### Outdated API Version  
_[APIVersion](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/APIVersion.ts)_ – Introducing newer API components may lead to unexpected issues with older versions of Flows, as they might not align with the underlying mechanics. Starting from API version 50.0, the **Api Version** attribute has been readily available on the Flow Object. To ensure smooth operation and reduce discrepancies between API versions, it is strongly advised to regularly update and maintain them.  
**Severity:** 🟡 *Warning*

### Auto Layout  
_[AutoLayout](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/AutoLayout.ts)_ – With Canvas Mode set to Auto-Layout, elements are spaced, connected, and aligned automatically, keeping your Flow neatly organized—saving you time.  
**Severity:** 🔵 *Note*

### Copy API Name  
_[CopyAPIName](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/CopyAPIName.ts)_ – Maintaining multiple elements with a similar name, like `Copy_X_Of_Element`, can diminish the overall readability of your Flow. When copying and pasting these elements, remember to update the API name of the newly created copy.  
**Severity:** 🟡 *Warning*

### Cyclomatic Complexity  
_[CyclomaticComplexity](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/CyclomaticComplexity.ts)_ – The number of loops and decision rules, plus the number of decisions. Use a combination of 1) subflows and 2) breaking flows into multiple concise trigger-ordered flows to reduce cyclomatic complexity within a single flow, ensuring maintainability and simplicity.  
**Severity:** 🔵 *Note*

### DML Statement In A Loop  
_[DMLStatementInLoop](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/DMLStatementInLoop.ts)_ – To prevent exceeding Apex governor limits, consolidate all your database operations—record creation, updates, or deletions—at the conclusion of the flow.  
**Severity:** 🔴 *Error*

### Duplicate DML Operation  
_[DuplicateDMLOperation](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/DuplicateDMLOperation.ts)_ – When a flow executes database changes or actions between two screens, prevent users from navigating backward between screens; otherwise, duplicate database operations may be performed.  
**Severity:** 🟡 *Warning*

### Flow Naming Convention  
_[FlowName](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/FlowName.ts)_ – The readability of a flow is paramount. Establishing a naming convention significantly enhances findability, searchability, and overall consistency. Include at least a domain and a brief description of the flow’s actions, for example `Service_OrderFulfillment`.  
**Severity:** 🔴 *Error*

### Get Record All Fields  
_[GetRecordAllFields](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/GetRecordAllFields.ts)_ – Following the principle of least privilege (PoLP), avoid using **Get Records** with “Automatically store all fields” unless necessary.  
**Severity:** 🟡 *Warning*

### Hardcoded Id  
_[HardcodedId](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/HardcodedId.ts)_ – Avoid hard-coding IDs because they are org specific. Instead, pass them into variables at the start of the flow—via merge-field URL parameters or a **Get Records** element.  
**Severity:** 🔴 *Error*

### Hardcoded Url  
_[HardcodedUrl](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/HardcodedUrl.ts)_ – Avoid hard-coding URLs because they are environment specific. Use an `$API` formula (preferred) or environment-specific sources like custom labels, metadata, or settings.  
**Severity:** 🔴 *Error*

### Inactive Flow  
_[InactiveFlow](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/InactiveFlow.ts)_ – Like cleaning out your closet: deleting unused flows is essential. Inactive flows can still cause trouble—such as accidentally deleting records during testing, or being activated as subflows.  
**Severity:** 🟡 *Warning*

### Missing Fault Path  
_[MissingFaultPath](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/MissingFaultPath.ts)_ – A flow may fail to execute an operation as intended. By default, the flow displays an error to the user and emails the creator. Customize this behavior by incorporating a Fault Path.  
**Severity:** 🟡 *Warning*

### Missing Filter Record Trigger
_[MissingFilterRecordTrigger](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/MissingFilterRecordTrigger.ts)_ – Record-triggered flows that lack filters on changed fields or entry conditions can lead to unnecessary executions on every record change. This may degrade system performance, hit governor limits faster, and increase resource consumption in high-volume orgs. 
**Severity:** 🟡 *Warning*

### Missing Flow Description  
_[FlowDescription](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/FlowDescription.ts)_ – Descriptions play a vital role in documentation. It is highly recommended to include details about where a flow is used and its intended purpose.  
**Severity:** 🔴 *Error*

### Missing Metadata Description  
_[MissingMetadataDescription](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/MissingMetadataDescription.ts)_ – Flags Flow elements (Get Records, Assignments, Decisions, Actions, etc.) and metadata components (Variables, Formulas, Constants, Text Templates) that lack a description. Adding concise descriptions greatly improves readability, maintainability, and helps AI tools understand your automation intent.  
**Severity:** 🔴 *Error*

### Missing Null Handler  
_[MissingNullHandler](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/MissingNullHandler.ts)_ – When a **Get Records** operation finds no data, it returns `null`. Validate data by using a Decision element to check for a non-null result.  
**Severity:** 🟡 *Warning*

### Process Builder  
_[ProcessBuilder](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/ProcessBuilder.ts)_ – Salesforce is transitioning away from Workflow Rules and Process Builder in favor of Flow. Begin migrating your organization’s automation to Flow.  
**Severity:** 🟡 *Warning*

### Record ID as String
_[RecordIdAsString](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/RecordIdAsString.ts)_ – Detects flows using a String variable named `recordId` as input when they could receive the entire record object instead. Since recent Salesforce releases, record pages and quick actions can pass the complete record, eliminating the need for an additional Get Records query and improving performance.  
**Severity:** 🔵 *Note*

### Recursive After Update  
_[RecursiveAfterUpdate](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/RecursiveAfterUpdate.ts)_ – After-update flows are meant for modifying **other** records. Using them on the same record can cause recursion. Consider **before-save** flows for same-record updates.  
**Severity:** 🟡 *Warning*

### Same Record Field Updates  
_[SameRecordFieldUpdates](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/SameRecordFieldUpdates.ts)_ – Similar to triggers, **before-save** contexts can update the same record via `$Record` without invoking DML.  
**Severity:** 🟡 *Warning*

### SOQL Query In A Loop  
_[SOQLQueryInLoop](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/SOQLQueryInLoop.ts)_ – To prevent exceeding Apex governor limits, consolidate all SOQL queries at the end of the flow.  
**Severity:** 🔴 *Error*

### Transform Instead of Loop
_[TransformInsteadOfLoop](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/TransformInsteadOfLoop.ts)_ – Detects Loop elements that directly connect to Assignment elements. Transform elements handle collection manipulation in bulk operations, providing significant performance improvements over iterative loop-assignment patterns.  
**Severity:** 🔵 *Note*

### Trigger Order  
_[TriggerOrder](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/TriggerOrder.ts)_ – Guarantee your flow execution order with the **Trigger Order** property introduced in Spring ’22.  
**Severity:** 🔵 *Note*

### Unconnected Element  
_[UnconnectedElement](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/UnconnectedElement.ts)_ – Avoid unconnected elements that are not used by the flow to keep flows efficient and maintainable.  
**Severity:** 🟡 *Warning*

### Unsafe Running Context  
_[UnsafeRunningContext](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/UnsafeRunningContext.ts)_ – This flow is configured to run in **System Mode without Sharing**, granting all users permission to view and edit all data. This can lead to unsafe data access.  
**Severity:** 🔴 *Error*

### Unused Variable  
_[UnusedVariable](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/UnusedVariable.ts)_ – To maintain efficiency and manageability, avoid including variables that are never referenced.  
**Severity:** 🟡 *Warning*

## Configuration

It is recommend to configure and define:

- The rules to be executed.
- The severity of violating any specific rule.
- Rule properties such as REGEX expressions.
- Any known exceptions that should be ignored during scanning.

```json
{
  "rules": {
    // Your rules here
  },
  "exceptions": {
    // Your exceptions here
  }
}
```

Most Lightning Flow Scanner distributions automatically resolve configurations from `.flow-scanner.yml`, `.flow-scanner.json`, or `package.json` → `flowScanner`.

By default, all default rules are executed. You can customize individual rules and override the rules to be executed without having to specify every rule. Below is a breakdown of the available attributes of rule configuration:

```json
{
  "rules": {
    "<RuleName>": {
      "severity": "<Severity>", // Override severity level
      "expression": "<Expression>", // Override rule expression
      "enabled": "false" // Disable this rule
    }
  }
}
```

### Defining Severity Levels

When the severity is not provided it will be `warning` by default. Other available values for severity are `error` and `note`. Define the severity per rule as shown below:

```json
{
  "rules": {
    "FlowDescription": {
      "severity": "error"
    },
    "UnusedVariable": {
      "severity": "note"
    }
  }
}
```

### Configuring Expressions

Some rules have additional attributes to configure, such as the expression, that will overwrite default values. These can be configured in the same way as severity as shown in the following example.

```json
{
  "rules": {
    "APIVersion": {
      "expression": "===58" // comparison operator
    },
    "FlowName": {
      "expression": "[A-Za-z0-9]" // regular expression
    }
  }
}
```

### Specifying Exceptions

Specifying exceptions allows you to exclude specific scenarios from rule enforcement. Exceptions can be specified at the flow, rule, or result level to provide fine-grained control. Below is a breakdown of the available attributes of exception configuration:

```json
{
  "exceptions": {
    "<FlowName>": {
      "<RuleName>": [
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
      "HardcodedId": ["Old_Lookup_1"]
      "MissingNullHandler": ["*"],
    }
  }
}
```

### Include Beta Rules

New rules are introduced in Beta mode before being added to the default ruleset. To include current Beta rules, enable the optional betamode parameter in your configuration:

```json
{
  "betaMode": true
}

```

### Rule Mode

By default, Lightning Flow Scanner runs **all** default rules and merges any custom configurations you provide. This means you can override specific rules without having to list every rule to be executed. If instead, you want to run **only** the rules you explicitly specify, use `"ruleMode": "isolated"`:
```json
{
  "ruleMode": "isolated"
}
```


## Installation

`lightning-flow-scanner-vsx` is available on:

| Visual Studio Marketplace                                                                                                                                                                                                                          | Open VSX Registry                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [![VS Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ForceConfigControl.lightning-flow-scanner-vsx?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=ForceConfigControl.lightning-flow-scanner-vsx) | [![Open VSX Version](https://img.shields.io/open-vsx/v/ForceConfigControl/lightning-flow-scanner-vsx?label=Open%20VSX)](https://open-vsx.org/extension/ForceConfigControl/lightning-flow-scanner-vsx) |

To install via CLI (VS Code)

```bash
code --install-extension ForceConfigControl.lightning-flow-scanner-vsx
```

---

## Development

> This project optionally uses [Volta](https://volta.sh) to guarantee the exact same Node.js and tool versions for every contributor. Install Volta with:
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
   pnpm run build:vsx
   ```

4. Run tests:

   ```bash
   pnpm test:vsx
   ```

<p><strong>Want to help improve Lightning Flow Scanner? See our <a href="https://github.com/Flow-Scanner/lightning-flow-scanner?tab=contributing-ov-file">Contributing Guidelines</a></strong></p>
