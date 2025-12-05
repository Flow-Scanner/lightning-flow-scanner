<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/assets/media/banner.png" alt="Lightning Flow Scanner" width="41%" />
  </a>
</p>
<p align="center"><i>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize Salesforce Flows</i></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Flow-Scanner/Lightning-Flow-Scanner/main/assets/media/vsx.gif" alt="Flow Overview"/>
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
| `flowscanner.SpecifyFiles` | Set to true to select .Flow file paths instead of a root directory. | `true`     |

---

## Default Rules

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
  "betamode": false // Enable beta rules
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

<p><strong>Want to help improve Lightning Flow Scanner? See our <a href="https://github.com/Flow-Scanner/lightning-flow-scanner-core?tab=contributing-ov-file">Contributing Guidelines</a></strong></p>
