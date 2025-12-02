<p align="center">
  <a href="https://github.com/Flow-Scanner">
    <img src="media/bannerslim.png" style="width: 41%;" />
  </a>
</p>
<p align="center"><em>Detect unsafe contexts, queries in loops, hardcoded IDs, and more to optimize Salesforce Flows.</em></p>

<p align="center">
 <img src="media/lfsaction.gif" alt="Lightning Flow Scanner Demo"/>
</p>

---

## Table of contens

- **[Usage](#usage)**
  - [Run Manually](#run-manuallyworkflow_dispatch)
  - [Run On Pull Requests](#run-on-pull-requestspull_request)
  - [Run On Push](#run-on-pushpush)  
- **[Configuration](#configuration)**
  - [Scanner Options](#scanner-options)
- **[Development](#development)**

---

## Usage

Lightning Flow Scanner Action is plug-and-play. Just add the GitHub workflow file `.github/workflows/scan-flows.yml` to automatically detect 20+ issues in flows — hardcoded IDs, unsafe contexts, inefficient SOQL/DML, recursion risks, missing fault handling — directly in pull requests. Example:

```yaml
name: Scan Flows

on:
  pull_request:
    branches: [ main ]

jobs:
  scan-flows:
    runs-on: ubuntu-latest
    permissions:
      contents: read           # Read flow files
      security-events: write   # Upload SARIF to Code Scanning

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run Flow Scanner
        id: scanner
        uses: Flow-Scanner/lightning-flow-scanner-action@v2.1.1
        with:
          outputMode: sarif      # optional (default)

      - name: Upload SARIF to Code Scanning
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: ${{ steps.flowscan.outputs.sarifPath }}
```
To set-up the action you must also Configure repository permissions:
- Navigate to _Repository Settings > Actions > General_.
- Under _Workflow permissions_, select:
- _Read and write permissions_.

**Privacy:** Zero user data collected. All processing is client-side.
→ See our [Security Policy](https://github.com/Flow-Scanner/lightning-flow-scanner-action?tab=security-ov-file).

### Run Manually(`workflow_dispatch`)
Trigger **Flow Scanner** on-demand to scan **all flows** in the repo.

```yaml
on: workflow_dispatch
```

- Navigate to the "Actions" tab of your GitHub repository.
- Click on "Run Flow Scanner" in the list of available workflows.
- Press the "Run workflow" button to trigger the action.

### Run on Pull Requests(`pull_request`)
Scan only changed flow files when a PR is opened or updated.

```
on:
  pull_request:
    branches: [ main ]
```

In Settings → Actions → General, ensure:
"Allow GitHub Actions to create and approve pull requests" is checked

### Run On Push(`push`)
Scan all flows on every push to selected branches.

`on:push:branches: [ main ]:` will trigger Flow Scanner to scan the every time a new change is pushed to the provide a list of branch names.

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

## Development

> This project optionally uses [Volta](https://volta.sh) to manage Node.js versions. Install Volta with:
>
> ```sh
> curl https://get.volta.sh | bash
> ```
>
> Volta will automatically use the Node.js version defined in `package.json`.

To debug the action you need to:

- _Install [`ncc`](https://www.npmjs.com/package/@vercel/ncc) for compilation. On MacOs/ Unix run:_
```bash
npm i -g @vercel/ncc
```

- _Install [`docker`](https://www.docker.com/) and [`act`](https://nektosact.com/installation/index.html) to run GitHub Actions locally. On MacOs/ Unix run:_
```bash
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash 
```

1. **Add the GITHUB_TOKEN as a repository secret**:
- Include the following key-value pair: `GITHUB_TOKEN=<personal-access-token>`. 
  > Replace `<personal-access-token>` with a valid _GitHub Personal Access Token_(PAT) with appropriate permissions (`repo`, `workflow` scopes).
2. Compile a new version
```bash
npm run build
```

2. Test the workflows locally:
When running locally with `act`, you need to create a `.secrets` file in the repo root(Recommended to use a Classic Personal Access Token with `repo` scope):

```bash
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
Then test with:

```bash
act workflow_dispatch --secret-file .secrets
```

**Want to help improve [Lightning Flow Scanner](https://github.com/Flow-Scanner)? See our [Contributing Guidelines](https://github.com/Flow-Scanner/lightning-flow-scanner-core/blob/main/CONTRIBUTING.md).**
