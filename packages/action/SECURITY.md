
# Security Policy for Lightning Flow Scanner

## Security Practices

- Code is open-source and peer-reviewed by the community.
- Vulnerabilities can be reported privately via [GitHub vulnerability reporting](https://github.com/Flow-Scanner/lightning-flow-scanner-action/security).
- Changes to the repository are scanned and reviewed before merging.

## Data Handling

This project collects zero user data. No credentials, PII, payment info, health data, or user content is ever stored, transmitted, or shared. All analysis runs 100% client-side with no network calls to external services.

**Note:** We temporarily use metadata (e.g., Flow metadata, timestamps) in-memory only for real-time functionality during your session. This data is never stored, logged, or transmitted and is discarded immediately when the session ends.

## Dependencies

We actively track and maintain an up-to-date inventory of all third-party dependencies to ensure security and compatibility. Our dependencies include:

| Package                         | License                                                                         | Purpose                                     |
| ------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| `@actions/core`               | [MIT](https://github.com/actions/toolkit/blob/main/packages/core/LICENSE)          | Toolkit for developing GitHub Actions       |
| `@actions/github`             | [MIT](https://github.com/actions/toolkit/blob/main/packages/github/LICENSE)        | Interact with the GitHub API in Actions     |
| `@vercel/ncc`                 | [MIT](https://github.com/vercel/ncc/blob/main/LICENSE)                             | Compile Node.js projects into a single file |
| `lightning-flow-scanner-core` | [MIT](https://github.com/Flow-Scanner/lightning-flow-scanner-core/blob/main/LICENSE.md) | Core library for scanning Salesforce flows  |
| `cosmiconfig`                        | [MIT](https://github.com/davidtheclark/cosmiconfig/blob/main/LICENSE) | Config file loader for JavaScript/Node |
