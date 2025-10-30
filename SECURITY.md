# Security Policy for Lightning Flow Scanner

## Security Practices

- Code is open-source and peer-reviewed by the community.
- Vulnerabilities can be reported privately via GitHub security features.
- Changes to the repository are scanned and reviewed before merging.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it using [GitHub vulnerability reporting](https://github.com/Flow-Scanner/lightning-flow-scanner-vsx/security).

## Data Handling

This project collects zero user data. No credentials, PII, payment info, health data, or user content is ever stored, transmitted, or shared. All analysis runs 100% client-side with no network calls to external services.

We temporarily use metadata (e.g., Flow metadata, timestamps) in-memory only for real-time functionality during your session. This data is never stored, logged, or transmitted and is discarded immediately when the session ends.

**Note:** You may manually save scan results (e.g., reports, CSV, JSON) to your local filesystem. These files are created at your request and remain under your full control. This tool does not access, upload, or retain them.

## Dependencies

We actively track and maintain an up-to-date inventory of all third-party dependencies to ensure security and compatibility. Our dependencies include:

| Package                         | License                                                                              | Purpose`                                       |
| ------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `convert-array-to-csv`        | [MIT](https://github.com/zemirco/convert-array-to-csv/blob/master/LICENSE)              | Converts JavaScript arrays into CSV format     |
| `lightning-flow-scanner-core` | [MIT](https://github.com/Flow-Scanner/lightning-flow-scanner-core/blob/main/LICENSE.md) | Salesforce Flow scanning utilities             |
| `tabulator-tables`            | [MIT](https://github.com/olifolkerd/tabulator/blob/master/LICENSE)                      | Interactive tables and data grids for web apps |
| `uuid`                        | [MIT](https://github.com/uuidjs/uuid/blob/main/LICENSE.md)                              | Generates RFC-compliant UUIDs                  |
| `xml2js`                      | [MIT](https://github.com/Leonidas-from-XIV/node-xml2js/blob/master/LICENSE)             | XML-to-JavaScript object converter             |
| `yaml`                        | [ISC](https://github.com/eemeli/yaml/blob/main/LICENSE)                                 | YAML parser and stringifier for JavaScript     |
