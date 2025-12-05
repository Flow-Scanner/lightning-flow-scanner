<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/assets/media/banner.png" alt="Lightning Flow Scanner" width="41%" />
  </a>
</p>
<p align="center"><i>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize Salesforce Flows</i></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/assets/media/sfdxgif.gif" alt="Flow Overview"/>
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

Lightning Flow Scanner CLI is plug-and-play. Just open any Salesforce project and run:

```bash
sf flow:scan
```

All default rules are applied automatically. 

```bash
sf flow:scan # scan flows in current directory
sf flow:fix -d src/force-app # fix flows in force-app directory
sf flow:scan --sarif > report.sarif # get results as SARIF file
```

| Flag            | Alias | Description                                   | Example                             |
|-----------------|-------|-----------------------------------------------|-------------------------------------|
| `--config`     | `-c`  | Path to config file                           | `-c .flow-scanner.yml`              |
| `--directory`  | `-d`  | Directory to scan                             | `-d force-app`                      |
| `--files`      | `-p`  | Specific flow files                           | `-p "flows/MyFlow.flow-meta.xml"`   |
| `--csv`        | `-v`  | CSV output                                    | `--csv > violations.csv`            |
| `--sarif`      | `-s`  | SARIF output (GitHub, etc.)                   | `--sarif > report.sarif`            |
| `--json`       |       | Pretty JSON output                            | `--json`                            |
| `--threshold`  | `-t`  | Fail on error/warn                            | `--threshold error`                 |
| `--betamode`   | `-z`  | Enable beta rules                             | `--betamode`                        |
| `--loglevel`   |       | Logging level                                 | `--loglevel debug`                  |

**Privacy:** Zero user data collected. All processing is client-side. → See our [Security Policy](https://github.com/Flow-Scanner/lightning-flow-scanner?tab=security-ov-file).

---

## Default Rules

<p>📌<strong>Tip:</strong> To link directly to a specific rule, use the full GitHub anchor link format. Example:</p>
<p><em><a href="https://github.com/Flow-Scanner/lightning-flow-scanner#unsafe-running-context">https://github.com/Flow-Scanner/lightning-flow-scanner#unsafe-running-context</a></em></p>

> Want to code a new rule? → See [How to Write a Rule](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/docs/write-a-rule.md)

### Action Calls In Loop

_[ActionCallsInLoop](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/ActionCallsInLoop.ts)_ - To prevent exceeding Apex governor limits, it is advisable to consolidate and bulkify your apex calls, utilizing a single action call containing a collection variable at the end of the loop.

### Outdated API Version

_[APIVersion](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/APIVersion.ts)_ - Introducing newer API components may lead to unexpected issues with older versions of Flows, as they might not align with the underlying mechanics. Starting from API version 50.0, the **Api Version** attribute has been readily available on the Flow Object. To ensure smooth operation and reduce discrepancies between API versions, it is strongly advised to regularly update and maintain them.

### Auto Layout

_[AutoLayout](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/AutoLayout.ts)_ - With Canvas Mode set to Auto‑Layout, elements are spaced, connected, and aligned automatically, keeping your Flow neatly organized—saving you time.

### Copy API Name

_[CopyAPIName](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/CopyAPIName.ts)_ - Maintaining multiple elements with a similar name, like `Copy_X_Of_Element`, can diminish the overall readability of your Flow. When copying and pasting these elements, remember to update the API name of the newly created copy.

### Cyclomatic Complexity

_[CyclomaticComplexity](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/CyclomaticComplexity.ts)_ - The number of loops and decision rules, plus the number of decisions. Use a combination of 1) subflows and 2) breaking flows into multiple concise trigger‑ordered flows to reduce cyclomatic complexity within a single flow, ensuring maintainability and simplicity.

### DML Statement In A Loop

_[DMLStatementInLoop](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/DMLStatementInLoop.ts)_ - To prevent exceeding Apex governor limits, consolidate all your database operations—record creation, updates, or deletions—at the conclusion of the flow.

### Duplicate DML Operation

_[DuplicateDMLOperation](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/DuplicateDMLOperation.ts)_ - When a flow executes database changes or actions between two screens, prevent users from navigating backward between screens; otherwise, duplicate database operations may be performed.

### Flow Naming Convention

_[FlowName](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/FlowName.ts)_ - The readability of a flow is paramount. Establishing a naming convention significantly enhances findability, searchability, and overall consistency. Include at least a domain and a brief description of the flow’s actions, for example `Service_OrderFulfillment`.

### Get Record All Fields

_[GetRecordAllFields](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/GetRecordAllFields.ts)_ - Following the principle of least privilege (PoLP), avoid using **Get Records** with “Automatically store all fields” unless necessary.

### Hardcoded Id

_[HardcodedId](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/HardcodedId.ts)_ - Avoid hard‑coding IDs because they are org specific. Instead, pass them into variables at the start of the flow—via merge‑field URL parameters or a **Get Records** element.

### Hardcoded Url

_[HardcodedUrl](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/HardcodedUrl.ts)_ - Avoid hard‑coding URLs because they are environment specific. Use an `$API` formula (preferred) or environment‑specific sources like custom labels, metadata, or settings.

### Inactive Flow

_[InactiveFlow](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/InactiveFlow.ts)_ - Like cleaning out your closet: deleting unused flows is essential. Inactive flows can still cause trouble—such as accidentally deleting records during testing, or being activated as subflows.

### Missing Fault Path

_[MissingFaultPath](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/MissingFaultPath.ts)_ - A flow may fail to execute an operation as intended. By default, the flow displays an error to the user and emails the creator. Customize this behavior by incorporating a Fault Path.

### Missing Flow Description

_[FlowDescription](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/FlowDescription.ts)_ - Descriptions play a vital role in documentation. We highly recommend including details about where flows are used and their intended purpose.

### Missing Metadata Description

_[MissingMetadataDescription](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/MissingMetadataDescription.ts)_ – Flags Flow elements (Get Records, Assignments, Decisions, Actions, etc.) and metadata components (Variables, Formulas, Constants, Text Templates) that lack a description. Adding concise descriptions greatly improves readability, maintainability, and helps AI tools understand your automation intent.

### Missing Null Handler

_[MissingNullHandler](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/MissingNullHandler.ts)_ - When a **Get Records** operation finds no data, it returns `null`. Validate data by using a Decision element to check for a non‑null result.

### Process Builder

_[ProcessBuilder](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/ProcessBuilder.ts)_ - Salesforce is transitioning away from Workflow Rules and Process Builder in favor of Flow. Begin migrating your organization’s automation to Flow.

### Recursive After Update

_[RecursiveAfterUpdate](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/RecursiveAfterUpdate.ts)_ - After‑update flows are meant for modifying **other** records. Using them on the same record can cause recursion. Consider **before‑save** flows for same‑record updates.

### Same Record Field Updates

_[SameRecordFieldUpdates](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/SameRecordFieldUpdates.ts)_ - Similar to triggers, **before‑save** contexts can update the same record via `$Record` without invoking DML.

### SOQL Query In A Loop

_[SOQLQueryInLoop](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/SOQLQueryInLoop.ts)_ - To prevent exceeding Apex governor limits, consolidate all SOQL queries at the end of the flow.

### Trigger Order

_[TriggerOrder](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/TriggerOrder.ts)_ - Guarantee your flow execution order with the **Trigger Order** property introduced in Spring ’22.

### Unconnected Element

_[UnconnectedElement](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/UnconnectedElement.ts)_ - Avoid unconnected elements that are not used by the flow to keep flows efficient and maintainable.

### Unsafe Running Context

_[UnsafeRunningContext](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/UnsafeRunningContext.ts)_ - This flow is configured to run in **System Mode without Sharing**, granting all users permission to view and edit all data. This can lead to unsafe data access.

### Unused Variable

_[UnusedVariable](https://github.com/Flow-Scanner/lightning-flow-scanner/blob/main/packages/core/src/main/rules/UnusedVariable.ts)_ - To maintain efficiency and manageability, avoid including variables that are never referenced.


---

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

Using the rules section of your configurations, you can specify the list of rules to be run. Furthermore, you can define the severity and configure expressions of rules. Below is a breakdown of the available attributes of rule configuration:

```json
{
  "rules": {
    "<RuleName>": {
      "severity": "<Severity>",
      "expression": "<Expression>"
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
      "severity": "error",
      "expression": "===58" // comparison operator
    },
    "FlowName": {
      "severity": "note",
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
        // Suppress a specific result:
        "<ResultName>",
        // Suppress ALL results of rule:
        "*",
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
      "MissingNullHandler": ["*"],
      "HardcodedId": ["Old_Lookup_1"]
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

---

## Installation

[![GitHub stars](https://img.shields.io/github/stars/Flow-Scanner/lightning-flow-scanner)](https://img.shields.io/github/stars/Flow-Scanner/lightning-flow-scanner)
[![GitHub contributors](https://img.shields.io/github/contributors/Flow-Scanner/lightning-flow-scanner.svg)](https://gitHub.com/Flow-Scanner/lightning-flow-scanner/graphs/contributors/)
[![License](https://img.shields.io/npm/l/lightning-flow-scanner.svg)](github.com/Flow-Scanner/lightning-flow-scanner/raw/main/LICENSE.md)
[![npm](https://img.shields.io/npm/v/lightning-flow-scanner?label=)](https://www.npmjs.com/package/lightning-flow-scanner)

```bash
sf plugins install lightning-flow-scanner
```
OR
```bash
npm install -g lightning-flow-scanner
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
   pnpm run build:cli
   ```

4. Run tests:

   ```bash
   pnpm test:cli
   ```

5. Linking the Salesforce CLI module locally(Optional):

   To link the module, run:

   ```bash
   cd packages/cli
   sf plugins link .
   ```



<p><strong>Want to help improve Lightning Flow Scanner? See our <a href="https://github.com/Flow-Scanner/lightning-flow-scanner?tab=contributing-ov-file">Contributing Guidelines</a></strong></p>
