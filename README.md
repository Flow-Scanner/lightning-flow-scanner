 [![Lightning Flow Scanner Banner](media/bannerslim.png)](https://github.com/Flow-Scanner)

[![Flow Overview](media/demo.gif)](https://github.com/Flow-Scanner)

## Features/Commands

Use our side bar or the **Command Palette** and type `Flow` to see the list of all available commands.

Use the `Scan Flows` command by choosing either a directory or a selection of flows to run the analysis on.
*More information on the default rules can be found in the [core  documentation](https://github.com/Flow-Scanner/lightning-flow-scanner-ce).*

Use the `Configurate Flow Rules` command to configure the rules executed during scanning.

Use the `Fix Flows` command to apply available fixes automatically.

The `Default Flow Rules` command can be used to view more details on the rules that are applied to Flows in the scans.

The `Calculate Flow Coverage` command calculates Flow Test coverage percentages by running the apex tests in your default connectedOrg.

<!-- commands -->

| Command                                          | Title                   |
| ------------------------------------------------ | ----------------------- |
| `lightningflowscanner.viewDefaultFlowRules`      | Default Flow Rules      |
| `lightningflowscanner.scanFlows`                 | Scan Flows              |
| `lightningflowscanner.debugView`                 | Debug Flow Scanner View |
| `lightningflowscanner.fixFlows`                  | Fix Flows               |
| `lightningflowscanner.calculateFlowTestCoverage` | Calculate Flow Coverage |
| `lightningflowscanner.configRules`               | Configurate Flow Rules  |

<!-- commands -->

<!-- configs -->

| Key                                     | Description                                                                       | Type      | Default                       |
| --------------------------------------- | --------------------------------------------------------------------------------- | --------- | ----------------------------- |
| `lightningFlowScanner.SpecifyFiles`     | Specify flow file paths instead of a root directory.                              | `boolean` | `false`                       |
| `lightningFlowScanner.NamingConvention` | Specify a REGEX expression to use as Flow Naming convention.                      | `string`  | `"[A-Za-z0-9]+_[A-Za-z0-9]+"` |
| `lightningFlowScanner.APIVersion`       | Specify an expression to validate the API version, i.e. '===50'(use at least 50). | `string`  | `">50"`                       |
| `lightningFlowScanner.Reset`            | Reset all configurations on every scan                                            | `boolean` | `false`                       |

<!-- configs -->
