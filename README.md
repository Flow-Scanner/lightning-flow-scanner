<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="media/bannerslim.png" style="width: 41%;" />
  </a>
</p>
<p align="center">Scans for unsafe contexts, hardcoded IDs, and other issues to  optimize your Flows.</p>

[![Flow Overview](media/demo.gif)](https://github.com/Flow-Scanner)

## Features/Commands

Use our side bar or the **Command Palette** and type `Flow Scanner` to see the list of all available commands.

* `Scan Flows` allows choosing either a directory or a selection of flows to run the analysis against.
  *More information on the default rules can be found in the [core documentation](https://github.com/Flow-Scanner/lightning-flow-scanner-core).*
* `Fix Flows` will apply available fixes automatically.
* `Open Documentation` can be used to reference the documentation.

| Command                                    | Title                   |
| ------------------------------------------ | ----------------------- |
| `lightningflowscanner.openDocumentation` | Open the documentation  |
| `lightningflowscanner.scanFlows`         | Scan Flows              |
| `lightningflowscanner.debugView`         | Debug Flow Scanner View |
| `lightningflowscanner.fixFlows`          | Fix Flows               |
| `lightningflowscanner.configRules`       | Configurate Flow Rules  |

## Configuration Options

| Key                                       | Description                                                                       | Default Value                   |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------- |
| `lightningFlowScanner.SpecifyFiles`     | Specify flow file paths instead of a root directory.                              | `false`                       |
| `lightningFlowScanner.NamingConvention` | Specify a REGEX expression to use as Flow Naming convention.                      | `"[A-Za-z0-9]+_[A-Za-z0-9]+"` |
| `lightningFlowScanner.APIVersion`       | Specify an expression to validate the API version, i.e. '===50'(use at least 50). | `">50"`                       |
| `lightningFlowScanner.Reset`            | Reset all configurations on every scan                                            | `false`                       |

## Development Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/Flow-Scanner/lightning-flow-scanner-vsx.git
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Build the project:

   ```bash
   npm run build
   ```
4. Run tests:

   ```bash
   npm run test
   ```

## Contributing

The original `lightning-flow-scanner-vsce` package was unpublished from the Visual Studio Marketplace after a Remote Code Execution (RCE) vulnerability was identified in its core dependency, `lightning-flow-scanner-core`. This issue, caused by unsafe custom rule loading, has been fully resolved in the [v5.1.0 release of the core library](https://github.com/Flow-Scanner/lightning-flow-scanner-core/releases/tag/v5.1.0). The [lightning-flow-scanner-vsx](https://github.com/Flow-Scanner/lightning-flow-scanner-vsx) fork, has focussed on security and maintainability, removing unsafe custom rule loading.

If you'd like to help us enhance Flow Scanner, please consider having a look at the [Contributing Guidelines](https://github.com/Flow-Scanner/lightning-flow-scanner-core/blob/main/CONTRIBUTING.md).
