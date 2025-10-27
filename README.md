<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="docs/images/banner.png" style="width: 41%;" />
  </a>
</p>
<p align="center"><i>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize your Salesforce Flows</i></p>

![FlowScan example](docs/images/sfdxgif.gif)

- **[Installation](#installation)**
- **[Usage](#usage)**
- **[Configuration](#configuration)**
  - [Defining the severity per rule](#defining-the-severity-per-rule)
  - [Configuring an expression](#configuring-an-expression)
  - [Specifying an exception](#specifying-an-exception)
- **[Development](#development)**

## Installation

Install with SFDX:

```sh-session
sf plugins install lightning-flow-scanner
```

Install with NPM:

```sh-session
npm install -g lightning-flow-scanner
```

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

  -u, --targetusername <username>                                   retrieve the latest metadata from the target before the scan.

  -d, --directory <C:\..\force-app\main\default\flows>              provide a directory to scan.

  --json                                                            set output format as json.

  --loglevel=(trace|debug|info|warn|error|fatal)                    [default: warn] logging level.
```

## Configuration

Create a .flow-scanner.json file in order to configure:

- A defined ruleset to be executed.
- The severity of violating any specific rule.
- Custom expressions or rule implementations.
- Any known exceptions that should be ignored during scanning.

```json
{
    "rules": {
        ...
    },
    "exceptions": {
        ...
    }
}
```

_Note: if you prefer YAML format, you can create a `.flow-scanner.yml` file using the same format._

### Defining the severity per rule

When the severity is not provided it will be `error` by default. Other available values for severity are `warning` and `note`. Define the severity per rule as shown in the following example.

```json
{
  "rules": {
    "FlowDescription": {
      "severity": "warning"
    },
    "UnusedVariable": {
      "severity": "error"
    }
  }
}
```

### Configuring an expression

Some rules have additional attributes to configure, such as the expression, that will overwrite default values. These can be configured in the same way as severity as shown in the following example. For more information on the available rules and configurations, please review the [flow scanner documentation](https://flow-scanner.github.io/lightning-flow-scanner-core/).

```json
{
  "rules": {
    "APIVersion": {
      "severity": "error",
      "expression": "===58"
    },
    "FlowName": {
      "severity": "error",
      "expression": "[A-Za-z0-9]"
    }
  }
}
```

### Specifying an exception

Specifying exceptions can be done by flow, rule and result(s), as shown in the following example.

```json
{
  "exceptions": {
    "AssignTaskOwner": {
      "UnusedVariable": ["somecount"]
    },
    "GetAccounts": {
      "UnusedVariable": ["incvar"]
    }
  }
}
```

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
  npm run build
```

5. **Linking** **Core Module (Optional)**

If you’re developing or testing updates to the core module, you can link it locally:

- In the core module directory, run:
  ```bash
  npm run link
  ```
- In this CLI project directory, run:
  ```bash
  npm link lightning-flow-scanner-core
  ```

<p><strong>Want to help improve Lightning Flow Scanner? See our <a href="https://github.com/Flow-Scanner/lightning-flow-scanner-core?tab=contributing-ov-file">Contributing Guidelines</a></strong></p>
