<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="media/bannerslim.png" style="width: 41%;" />
  </a>
</p>
<p align="center">Scans for unsafe contexts, hardcoded IDs, and other issues to optimize your Flows.</p>

<p align="center">
 <img src="media/demo.gif" alt="Flow Overview" width="88%" />
</p>

## Usage

Use our side bar or the **Command Palette** and type `Flow Scanner` to see the list of all available commands.

* `Configure Rules` Allows to define rules and expressions as per defined in the [core documentation](https://github.com/Flow-Scanner/lightning-flow-scanner-core).
* `Scan Flows` allows choosing either a directory or a selection of flows to run the analysis against.
* `Fix Flows` will apply available fixes automatically.
* `Open Documentation` can be used to reference the documentation.

## Configuration

| Key                                       | Description                                                                       | Default Value                   |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------- |
| `lightningFlowScanner.SpecifyFiles`     | Specify flow file paths instead of a root directory.                              | `false`                       |
| `lightningFlowScanner.NamingConvention` | Specify a REGEX expression to use as Flow Naming convention.                      | `"[A-Za-z0-9]+_[A-Za-z0-9]+"` |
| `lightningFlowScanner.APIVersion`       | Specify an expression to validate the API version, i.e. '===50'(use at least 50). | `">50"`                       |

## Development

> This project optionally uses [Volta](https://volta.sh) to manage Node.js versions. Install Volta with:
>
> ```sh
> curl https://get.volta.sh | bash
> ```
>
> Volta will automatically use the Node.js version defined in `package.json`.

1. Clone the repo:

   ```bash
   git clone https://github.com/Flow-Scanner/lightning-flow-scanner-vsx.git
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. run dev environment

   ```
   npm run watch
   ```
4. build vsix

   ```
   npm run build
   ```

## Contributing

The original `lightning-flow-scanner-vsce` package was unpublished from the Visual Studio Marketplace after a Remote Code Execution (RCE) vulnerability was identified in its core dependency, `lightning-flow-scanner-core`. This issue, caused by unsafe custom rule loading, has been fully resolved in the [v5.1.0 release of the core library](https://github.com/Flow-Scanner/lightning-flow-scanner-core/releases/tag/v5.1.0). The [lightning-flow-scanner-vsx](https://github.com/Flow-Scanner/lightning-flow-scanner-vsx) fork, focusses on security and maintainability.

###### Want to help improve Lightning Flow Scanner? See our [Contributing Guidelines](https://github.com/Flow-Scanner/lightning-flow-scanner-core?tab=contributing-ov-file).
