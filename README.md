 [![Lightning Flow Scanner Banner](media/bannerslim.png)](https://github.com/Flow-Scanner)

[![Flow Overview](media/demo.gif)](https://github.com/Flow-Scanner)

## Features/Commands

Use our side bar or the **Command Palette** and type `Flow Scanner` to see the list of all available commands.

* `Scan Flows` allows choosing either a directory or a selection of flows to run the analysis against.
  *More information on the default rules can be found in the [core documentation](https://github.com/Flow-Scanner/lightning-flow-scanner-ce).*
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

<!-- configs -->
