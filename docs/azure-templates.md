## Azure Pipelines Templates

These samples show two common ways to run the Lightning Flow Scanner from Azure DevOps. Each template installs the Salesforce CLI inside the official `salesforce/cli:latest-slim` container, adds the `lightning-flow-scanner` plugin, executes `sf flow:scan`, and uploads a SARIF report as a build artifact so violations can be reviewed with the SARIF Results Viewer extension.

### Included templates

- [azure-pipelines-flow-FullScan.yml`](../docs/templates/azure-devops/azure-pipelines-flow-FullScan.yml)
  Runs the scanner across the entire repo (or the default metadata folder) every time the pipeline triggers. The job is intentionally small: check out the code, ensure the plugin is available, run `sf flow:scan --sarif`, and publish `results.sarif` via `PublishBuildArtifacts@1`. Add additional stages (tests, packaging) by extending this template.

- [`azure-pipelines-flow-changedFiles.yml`](../docs/templates/azure-devops/azure-pipelines-flow-changedFiles.yml)  
  Optimizes for pull requests by scanning only files that change relative to a target branch (default `origin/main`). It persists Git credentials so it can `git fetch` and uses a bash step to copy added/modified files into `$(Build.ArtifactStagingDirectory)/diff`. The scanner is then pointed at that folder to shorten runtimes while still producing a SARIF artifact.

### How to use these templates

1. Copy the desired YAML file into your Azure DevOps repo (commonly under `.azure-pipelines/` or at the root).
2. In Azure DevOps, create a new pipeline and reference the YAML path when prompted.
3. For the changed-files variant, update the `variables` block if your default branch is not `origin/main`, or if you want to store diffs elsewhere.
4. (Optional) Install the [SARIF SAST Scans Tab extension](https://marketplace.visualstudio.com/items?itemName=sariftools.scans) so teams can review `results.sarif` directly within the pipeline summary.

### Dependencies and related docs

- **Salesforce CLI**: Provided by the `salesforce/cli:latest-slim` container. If you switch containers/VMs, ensure `sf` is installed and on the `PATH`.  
- **Lightning Flow Scanner plugin**: Installed via `sf plugins install lightning-flow-scanner`. See the main [Lightning Flow Scanner README](../README.md) for configuration options such as custom rule sets.  
- **Git (changed-files pipeline)**: Requires fetch permissions on the target branch to build the diff. Azure Pipelines handles this automatically when `persistCredentials: true` and `fetchDepth: 1` are set.  
- **SARIF tooling**: Pipelines emit `CodeAnalysisLogs/results.sarif`. Use Azure DevOps extensions or downstream tooling (GitHub Advanced Security, VS Code SARIF viewer, etc.) to visualize the findings.

Adapt these templates as needed: add caching, integrate test stages, or call other CLI commands before/after the flow scan to match your organization's release process.
