# Security Policy for Lightning Flow Scanner

## Security Practices

- Code is open-source and peer-reviewed by the community.
- Vulnerabilities can be reported privately via [GitHub vulnerability reporting](https://github.com/Flow-Scanner/lightning-flow-scanner/security).
- All changes are scanned with [Snyk](https://github.com/snyk/cli) prior to publication.
- Releases are published to npm using **GitHub Actions Trusted Publishing (OIDC)**.
- Tags (`v*`) trigger automated `npm publish`, providing a full audit trail.

## Data Handling

This tool collects zero user data. No credentials, PII, payment info, health data, or user content is ever stored, transmitted, or shared. All analysis runs 100% client-side with no network calls to external services.

We temporarily use metadata (e.g., Flow metadata, timestamps) in-memory only for real-time functionality during your session. This data is never stored, logged, or transmitted and is discarded immediately when the session ends.

## Dependencies

We actively track and maintain an up-to-date inventory of all third-party dependencies to ensure security and compatibility. Our dependencies include:

### Core

| Package           | License                                                                           | Purpose                                        |
| ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| `fast-xml-parser` | [MIT](https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/LICENSE) | Validate XML, Parse XML and Build XML rapidly. |

### CLI

| Package                             | License | Purpose |
| ----------------------------------- | ------- | ------- |
| `@oclif/core`                        | [MIT](https://github.com/oclif/oclif/blob/main/LICENSE) | CLI framework core utilities |
| `@salesforce/core`                   | [BSD-3-Clause](https://github.com/salesforce/core/blob/main/LICENSE) | Salesforce core library for CLI plugins |
| `@salesforce/sf-plugins-core`       | [BSD-3-Clause](https://github.com/salesforce/sf-plugins-core/blob/main/LICENSE) | Base library for Salesforce CLI plugins |
| `chalk`                              | [MIT](https://github.com/chalk/chalk/blob/main/license) | Terminal string styling (colors) |
| `cosmiconfig`                        | [MIT](https://github.com/davidtheclark/cosmiconfig/blob/main/LICENSE) | Config file loader for JavaScript/Node |
| `glob`                               | [MIT](https://github.com/isaacs/node-glob/blob/master/LICENSE) | File pattern matching |

### Action

| Package                         | License                                                                         | Purpose                                     |
| ------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| `@actions/core`               | [MIT](https://github.com/actions/toolkit/blob/main/packages/core/LICENSE)          | Toolkit for developing GitHub Actions       |
| `@actions/github`             | [MIT](https://github.com/actions/toolkit/blob/main/packages/github/LICENSE)        | Interact with the GitHub API in Actions     |
| `cosmiconfig`                        | [MIT](https://github.com/davidtheclark/cosmiconfig/blob/main/LICENSE) | Config file loader for JavaScript/Node |

### VSX

| Package                         | License                                                                              | Purpose`                                       |
| ------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `convert-array-to-csv`        | [MIT](https://github.com/zemirco/convert-array-to-csv/blob/master/LICENSE)              | Converts JavaScript arrays into CSV format     |
| `tabulator-tables`            | [MIT](https://github.com/olifolkerd/tabulator/blob/master/LICENSE)                      | Interactive tables and data grids for web apps |
| `uuid`                        | [MIT](https://github.com/uuidjs/uuid/blob/main/LICENSE.md)                              | Generates RFC-compliant UUIDs                  |
| `cosmiconfig`                        | [MIT](https://github.com/davidtheclark/cosmiconfig/blob/main/LICENSE) | Config file loader for JavaScript/Node |
