# Lightning Flow Scanner Demo Repository

This directory contains sample Salesforce Flows used to demo Lightning Flow Scanner rules.

You can:

- Use these flows to demo scanner output.
- Deploy them to an Org for integrated tests.

## Available Flows

| Flow Name                  | Description                                                         | Key Rule(s) Demonstrated      |
|----------------------------|---------------------------------------------------------------------|-------------------------------|
| Copy_API_Name              | Flow with copied elements retaining similar API names, reducing readability. | CopyAPIName                   |
| Cyclomatic_Complexity      | High-complexity Flow with multiple loops/decisions in a single path.        | CyclomaticComplexity          |
| DML_Statement_In_A_Loop    | DML operations inside loops, risking governor limits.                    | DMLStatementInLoop            |
| Duplicate_DML_Operation    | DML between screens, allowing backward navigation duplicates.             | DuplicateDMLOperation         |
| FlowNamingConvention       | Flow with non-descriptive or inconsistent naming.                        | FlowName                      |
| Hardcoded_Id               | Flow using org-specific hardcoded IDs instead of variables.              | HardcodedId                   |
| Missing_Error_Handler      | Flow lacking fault paths for error handling.                            | MissingFaultPath              |
| Missing_Flow_Description   | Flow without a description for documentation.                           | FlowDescription               |
| Missing_Null_Handler       | Get Records without null checks post-query.                             | MissingNullHandler            |
| Outdated_API_Version       | Flow using an old API version (pre-50.0).                               | APIVersion                    |
| SOQL_Query_In_A_Loop       | SOQL queries inside loops, hitting limits.                              | SOQLQueryInLoop               |
| Unconnected_Element        | Flow with unused/unconnected elements.                                  | UnconnectedElement            |
| Unsafe_Running_Context     | Flow set to System Mode without Sharing.                                | UnsafeRunningContext          |
| Unused_Variable            | Flow declaring variables not referenced.                                | UnusedVariable                |

## Getting Started

Follow these steps to get up and running with the Lightning Flow Scanner Example Flows:

1. To open this [Salesforce Project](../example-flows) in CLI:

   ```bash
   cd example-flows
   ```

2. Deploy Flows(optional)

   ```bash
   sf project deploy start --source-dir force-app
   ```