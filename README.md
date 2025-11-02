<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="media/bannerslim.png" style="width: 41%;" />
  </a>
</p>
<p align="center"><i>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize Salesforce Flows</i></p>

<p align="center">
 <img src="media/demo.gif" alt="Flow Overview" width="88%" />
</p>

## Usage

Use our side bar or the **Command Palette** and type `flowscanner` to see the list of all available commands.

* `Configure Flow Scanner` - Set up rules in `.flow-scanner.yml` (see [scanner documentation](https://github.com/Flow-Scanner/lightning-flow-scanner-core))
* `Scan Flows` - Analyze a directory or selected flow files
* `Fix Flows` - Automatically apply available fixes
* `Flow Scanner Documentation` - Open the rules reference guide

**Privacy:** Zero user data collected. All processing is client-side.
→ See Data Handling in our [Security Policy](https://github.com/Flow-Scanner/lightning-flow-scanner-vsx?tab=security-ov-file).

## Configuration

It is recommended to set up a `.flow-scanner.yml` and define:

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

### Extension Settings

| Extension Settings           | Description                                                         | Default Value |
| ---------------------------- | ------------------------------------------------------------------- | ------------- |
| `flowscanner.SpecifyFiles` | Set to true to select .Flow file paths instead of a root directory. | `false`     |

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
  git clone https://github.com/Flow-Scanner/lightning-flow-scanner-vsx.git
```

2. **Install Dependencies**

```bash
  npm install
```

3. **Build the Project**

```bash
  npm run build
```

4. **Watch for Changes**

```bash
  npm run watch
```

5. **Run End-to-End Tests**

```bash
  npm run test
```

6. **Linking** **Core Module (Optional)**

If you’re developing or testing updates to the core module, you can link it locally:

- In the core module directory, run:
  ```bash
  npm run link
  ```
- In this CLI project directory, run:
  ```bash
  npm link @flow-scanner/lightning-flow-scanner-core
  ```

## VSCE to VSX

The `lightning-flow-scanner-vsce` package was unpublished from the Visual Studio and Open VSX Marketplaces due to a vulnerability stemming from unsafe rule loading. The issue was addressed in [core library v5](https://github.com/Flow-Scanner/lightning-flow-scanner-core/releases/tag/v5.1.0). This fork, created on 22/09/2025, emphasizes security and maintainability.

<p><strong>Want to help improve Lightning Flow Scanner? See our <a href="https://github.com/Flow-Scanner/lightning-flow-scanner-core?tab=contributing-ov-file">Contributing Guidelines</a></strong></p>
<!-- force-contributors-render: 2025-10-28 22:10:01 -->
