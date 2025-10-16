export const RuleAliases: Record<string, string> = {
  // Allow for backwards compatibility mappings
  // Will be removed once exposed in the core package
  ActionCallsInLoop: "ActionCallInLoop",
  APIVersion: "InvalidAPIVersion",
  AutoLayout: "MissingAutoLayout",
  CopyAPIName: "UnclearAPINaming",
  CyclomaticComplexity: "ExcessiveCyclomaticComplexity",
  DMLStatementInLoop: "DMLInLoop",
  DuplicateDMLOperation: "DuplicateDML",
  FlowDescription: "MissingFlowDescription",
  FlowName: "InvalidNamingConvention",
  ProcessBuilder: "ProcessBuilderUsage",
  RecursiveAfterUpdate: "RecursiveRecordUpdate",
  SOQLQueryInLoop: "SOQLInLoop",
  TriggerOrder: "UnspecifiedTriggerOrder"
};