<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="docs/images/banner.png" style="width: 41%;" />
  </a>
</p>

<p align="center"><i>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize Salesforce Flows</i></p>

<p align="center">
 <img src="docs/images/sfdxgif.gif" alt="Flow Overview"/>
</p>

---

## Table of contens

- **[Usage](#usage)**
  - [Examples](#examples)
  - [Templates](#templates)
- **[Configuration](#configuration)**
  - [Scanner Options](#scanner-options)
---

## Usage

Lightning Flow Scanner CLI is plug-and-play. Open any project with flows and run `sf flow:scan`; all default rules and thresholds are applied automatically.

```sh-session
sf flow:scan [options]
```

Customize the scan behavior using the following options:

| Flag                | Alias | Description                                                                 | Example                                      |
|---------------------|-------|-----------------------------------------------------------------------------|----------------------------------------------|
| `--config`          | `-c`  | Path to the configuration file                                              | `-c ./dir/flow-scanner.json`                       |
| `--directory`       | `-d`  | Directory to scan recursively                                               | `-d ./force-app/main/`          |
| `--files`           | `-p`  | Space-separated list of specific flow files to scan                         | `-p "flow1.flow-meta.xml" "flows/flow2.flow-meta.xml"` |
| `--csv`             | `-v`  | Get violations only, csv ready.                                           | `--csv > violations.csv`                                 |
| `--sarif`           | `-s`  | Output results in SARIF format to stdout                                    | `--sarif > results.sarif`                    |
| `--threshold`       | `-t`  | Fail the run on errors of this level or higher (`error`\|`warn`\|`info`)    | `--threshold warn`                           |
| `--betamode`        | `-z`  | Enable experimental beta rules                                              | `--betamode`                                 |
| `--json`            |       | Output results as pretty-printed JSON                                       | `--json`                                     |
| `--loglevel`        |       | Logging verbosity `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` | `--loglevel debug`                           |

**Privacy:** Zero user data collected. All processing is client-side. → See our [Security Policy](https://github.com/Flow-Scanner/lightning-flow-scanner-cli?tab=security-ov-file).

### Examples

Quick local scan with JSON output
```
sf flow:scan -d ./flows --json
```

CI/CD ready with SARIF
```
sf flow:scan -d src/flows --sarif > report.sarif
```

Scan only two specific flows including beta rules
```
sf flow:scan -p "flows/Opportunity_Auto_Approve.flow-meta.xml" "flows/Case_Escalation.flow-meta.xml" -z --json
```

### Templates
Ready-to-use CI/CD templates and a **native GitHub Action**.  
All examples: [`docs/examples/`](docs/examples/).

| Platform       | Template Type                     | Link |
|----------------|-----------------------------------|------|
| Azure DevOps   | Full Project Scan                 | [`azure-pipelines-flow-FullScan.yml`](docs/examples/azure-devops/azure-pipelines-flow-FullScan.yml) |
| Azure DevOps   | Change-Based Scan                 | [`azure-pipelines-flow-changedFiles.yml`](docs/examples/azure-devops/azure-pipelines-flow-changedFiles.yml) |
| Copado DevOps | Full & Change-Based Scans       | [CI/CD Plugin](https://github.com/Flow-Scanner/lightning-flow-scanner-copado) |
| GitHub | Full & Change-Based Scans       | [`scan-flows.yml`](docs/examples/github-action/scan-flows.yml) |


---

## Configuration

It is recommended to set up a `.flow-scanner.yml` and define:

- The rules to be executed.
- The severity of violating any specific rule.
- Rule properties such as REGEX expressions.
- Any known exceptions that should be ignored during scanning.

### Scanner Options

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

Using the rules section of your configurations, you can specify the list of rules to be run. Furthermore, you can define the severity and configure expressions of rules.  Below is a breakdown of the available attributes of rule configuration:

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

Note: if you prefer JSON format, you can create a `.flow-scanner.json` file using the same format. For a more on configurations, review the [scanner documentation](https://flow-scanner.github.io/lightning-flow-scanner-core/#configuration).

---

## Installation

[![GitHub stars](https://img.shields.io/github/stars/Flow-Scanner/lightning-flow-scanner-cli)](https://img.shields.io/github/stars/Flow-Scanner/lightning-flow-scanner-cli)
[![GitHub contributors](https://img.shields.io/github/contributors/Flow-Scanner/lightning-flow-scanner-cli.svg)](https://gitHub.com/Flow-Scanner/lightning-flow-scanner-cli/graphs/contributors/)
[![License](https://img.shields.io/npm/l/lightning-flow-scanner.svg)](github.com/Flow-Scanner/lightning-flow-scanner-cli/raw/main/LICENSE.md)
[![npm version](https://img.shields.io/npm/v/lightning-flow-scanner?label=npm)](https://www.npmjs.com/package/lightning-flow-scanner)

| **Install with sf (Salesforce CLI)**            | **Install globally with npm**               |
| ----------------------------------------------------- | ------------------------------------------------- |
| `sf plugins install lightning-flow-scanner` | `npm install -g lightning-flow-scanner` |

---