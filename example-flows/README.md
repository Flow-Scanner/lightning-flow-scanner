# Lightning Flow Scanner Demo Repository

This directory contains sample Salesforce Flows used to demo Lightning Flow Scanner rules.

You can:

- Use these flows to demo scanner output.
- Deploy them to an Org for integrated tests.

## Demo Flows

These flows demonstrate common violations detected by Lightning Flow Scanner rules:

| Flow Name                          | Rule Demonstrated                | Description                                                                 |
|------------------------------------|----------------------------------|-----------------------------------------------------------------------------|
| Demo_Action_In_Loop                | Action Call In Loop              | Demonstrates action calls inside a loop that can exhaust governor limits. Best practice: bulkify by collecting data in the loop, then make a single action call with a collection. |
| Demo_DML_In_Loop                   | DML Statement In Loop            | Shows DML operations (create/update/delete) inside a loop, a high-risk anti-pattern that frequently causes governor limit exceptions. |
| Demo_Duplicate_DML                 | Duplicate DML Operation          | Illustrates how database operations across multiple screens can execute multiple times when users navigate backward. |
| Demo_Complexity                    | Cyclomatic Complexity            | High-complexity flow with many loops and decision elements that reduce maintainability. |
| DemoBadName                        | Flow Naming Convention           | Flow with a non-descriptive name that doesn't follow organizational naming standards. |
| Demo_All_Fields                    | Get Record All Fields            | Get Records element retrieving all fields unnecessarily, impacting performance and exposing unnecessary data. |
| Demo_Hardcoded_Id                  | Hardcoded Id                     | Flow using hardcoded record IDs that are unique to a specific org and won't work in other environments. |
| Demo_Hardcoded_Url                 | Hardcoded URL                    | Flow containing hardcoded Salesforce URLs that break when migrated between sandboxes and production. |
| Demo_Inactive                      | Inactive Flow                    | Flow marked as inactive that may need review or activation. |
| Demo_Old_API_Version               | Invalid API Version              | Flow using an outdated API version. |
| Demo_No_Auto_Layout                | Missing Auto Layout              | Flow not using auto-layout canvas mode. |
| Demo_No_Fault_Path                 | Missing Fault Path               | Flow without fault path connectors for proper error handling. |
| Demo_No_Description                | Missing Flow Description         | Flow lacking a description for documentation and maintainability. |
| Demo_No_Null_Check                 | Missing Null Handler             | Get Records element without null checks, risking errors when no records are found. |
| Demo_No_Trigger_Order              | Missing Trigger Order            | Record-triggered flow missing trigger order configuration. |
| Demo_Recursion                     | Recursive After Update           | After-update trigger flow that can cause infinite recursion by updating the triggering record. |
| Demo_Same_Record_Update            | Same Record Field Updates        | Flow updating the same record field multiple times inefficiently. |
| Demo_SOQL_In_Loop                  | SOQL Query In Loop               | SOQL queries placed inside a loop, risking governor limit exceptions. |
| Demo_Unclear_Names                 | Unclear API Name                 | Flow with copied elements retaining similar API names like "Copy_1_of_Assignment", reducing readability. |
| Demo_Unreachable                   | Unreachable Element              | Flow with elements that cannot be reached from the start element. |
| Demo_System_Mode                   | Unsafe Running Context           | Flow configured to run in System Mode without Sharing, potentially exposing unauthorized data. |
| Demo_Unused_Variable               | Unused Variable                  | Flow declaring variables that are never referenced or used. |

## Testing Flows

The `force-app/testing/` directory contains additional flows used for integration tests, including both violation examples and fixed versions for testing auto-fixes and edge cases.

## Getting Started

To deploy the Demo Flows using the Salesforce CLI:

   ```bash
   sf project deploy start --source-dir force-app
   ```