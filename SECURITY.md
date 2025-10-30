# Security Policy for Lightning Flow Scanner

## Security Practices

- Code is open-source and peer-reviewed by the community.
- Vulnerabilities can be reported privately via GitHub security features.
- Changes to the repository are scanned and reviewed before merging.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it using [GitHub vulnerability reporting](https://github.com/Flow-Scanner/lightning-flow-scanner-cli/security).

## Data Handling

This project collects zero user data. No credentials, PII, payment info, health data, or user content is ever stored, transmitted, or shared. All analysis runs 100% client-side with no network calls to external services.

**Note:** We temporarily use metadata (e.g., Flow metadata, timestamps) in-memory only for real-time functionality during your session. This data is never stored, logged, or transmitted and is discarded immediately when the session ends.

## Dependencies

We actively track and maintain an up-to-date inventory of all third-party dependencies to ensure security and compatibility. Our dependencies include:

| Package                             | License | Purpose |
| ----------------------------------- | ------- | ------- |
| `@oclif/core`                        | [MIT](https://github.com/oclif/oclif/blob/main/LICENSE) | CLI framework core utilities |
| `@salesforce/core`                   | [BSD-3-Clause](https://github.com/salesforce/core/blob/main/LICENSE) | Salesforce core library for CLI plugins |
| `@salesforce/sf-plugins-core`       | [BSD-3-Clause](https://github.com/salesforce/sf-plugins-core/blob/main/LICENSE) | Base library for Salesforce CLI plugins |
| `chalk`                              | [MIT](https://github.com/chalk/chalk/blob/main/license) | Terminal string styling (colors) |
| `cosmiconfig`                        | [MIT](https://github.com/davidtheclark/cosmiconfig/blob/main/LICENSE) | Config file loader for JavaScript/Node |
| `fs-extra`                           | [MIT](https://github.com/jprichardson/node-fs-extra/blob/master/LICENSE) | Extended filesystem utilities |
| `glob`                               | [MIT](https://github.com/isaacs/node-glob/blob/master/LICENSE) | File pattern matching |
| `lightning-flow-scanner-core`        | [MIT](https://github.com/Flow-Scanner/lightning-flow-scanner-core/blob/main/LICENSE.md) | Salesforce Flow scanning utilities |
