<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="docs/images/banner.png" style="width: 41%;" />
  </a>
</p>

<p align="center"><i>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize Salesforce Flows</i></p>

<p align="center">
 <img src="docs/images/sfdxgif.gif" alt="Flow Overview" width="76%" />
</p>

---

## Table of contens

- **[Usage](#usage)**
- **[Configuration](#configuration)**
  - **[Scanner Options](#scanner-options)**
- **[Installation](#installation)**
- **[Development](#development)**

---

## Usage

Lightning Flow Scanner CLI is plug-and-play. Open any project with flows and run `sf flow:scan`; all default rules and thresholds are applied automatically.

```sh-session
sf flow:scan [options]
```

Customize the scan behavior using the following options:

```sh-session
  -c, --config <path>                                               provide a path to the configuration file.

  -f, --failon                                                      provide a threshold level for returning status 1

  -p, --files <C:\..\flow1.flow, C:\..\flow2.flow>                  provide a space-separated list of flow paths to scan.

  -d, --directory <C:\..\force-app\main\default\flows>              provide a directory to scan.

  --json                                                            set output format as json.

  -z, --betamode                                                     a runtime toggle to enable experimental beta rules.

  --loglevel=(trace|debug|info|warn|error|fatal)                    [default: warn] logging level.
```

**Privacy:** Zero user data collected. All processing is client-side. → See Data Handling in our [Security Policy](https://github.com/Flow-Scanner/lightning-flow-scanner-cli?tab=security-ov-file).

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
  },
  "betamode": false // include rules currently in beta
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

Note: if you prefer JSON format, you can create a `.flow-scanner.json` file using the same format. For a more on configurations, review the [scanner documentation](https://flow-scanner.github.io/lightning-flow-scanner-core/#configurations).

---

## Installation

`lightning-flow-scanner-cli` is published to **npm** only.

[![npm version](https://img.shields.io/npm/v/lightning-flow-scanner?label=npm)](https://www.npmjs.com/package/lightning-flow-scanner)

| **Install with sf (Salesforce CLI)** | **Install globally with npm** |
|--------------------------------------|-------------------------------|
| ```bash<br>sf plugins install lightning-flow-scanner``` | ```bash<br>npm install -g lightning-flow-scanner``` |

---

## Development

> This project optionally uses [Volta](https://volta.sh) to manage Node.js versions. Install Volta with:
>
> ```sh
> curl https://get.volta.sh | bash
> ```
>
> Volta will automatically use the Node.js version defined in `package.json`.

1. **Clone the repository**

```bash
  git clone https://github.com/Flow-Scanner/lightning-flow-scanner-cli.git
```

2. **Install Dependencies**

```bash
  npm install
```

3. **Build Executables**

```bash
  npm run build
```

4. **Run Tests**

```bash
  npm run test
```

5. **Linking** **Core Module (Optional)**

If you’re developing or testing updates to the core module, you can link it locally:

- In the core module directory, run:
  ```bash
  npm run link
  ```
- In this CLI project directory, run:
  ```bash
  npm link @flow-scanner/lightning-flow-scanner-core
  ```

<p><strong>Want to help improve Lightning Flow Scanner? See our <a href="https://github.com/Flow-Scanner/lightning-flow-scanner-core?tab=contributing-ov-file">Contributing Guidelines</a></strong></p>
