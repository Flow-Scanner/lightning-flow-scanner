import { ActionCallsInLoop } from "../rules/ActionCallsInLoop";
import { APIVersion } from "../rules/APIVersion";
import { AutoLayout } from "../rules/AutoLayout";
import { CopyAPIName } from "../rules/CopyAPIName";
import { CyclomaticComplexity } from "../rules/CyclomaticComplexity";
import { DMLStatementInLoop } from "../rules/DMLStatementInLoop";
import { DuplicateDMLOperation } from "../rules/DuplicateDMLOperation";
import { FlowDescription } from "../rules/FlowDescription";
import { FlowName } from "../rules/FlowName";
import { GetRecordAllFields } from "../rules/GetRecordAllFields";
import { HardcodedId } from "../rules/HardcodedId";
import { HardcodedUrl } from "../rules/HardcodedUrl";
import { InactiveFlow } from "../rules/InactiveFlow";
import { MissingFaultPath } from "../rules/MissingFaultPath";
import { MissingNullHandler } from "../rules/MissingNullHandler";
import { ProcessBuilder } from "../rules/ProcessBuilder";
import { RecursiveAfterUpdate } from "../rules/RecursiveAfterUpdate";
import { SameRecordFieldUpdates } from "../rules/SameRecordFieldUpdates";
import { SOQLQueryInLoop } from "../rules/SOQLQueryInLoop";
import { TriggerOrder } from "../rules/TriggerOrder";
import { UnconnectedElement } from "../rules/UnconnectedElement";
import { UnsafeRunningContext } from "../rules/UnsafeRunningContext";
import { UnusedVariable } from "../rules/UnusedVariable";
import { MissingMetadataDescription } from "../rules/MissingMetadataDescription";
import { MissingFilterRecordTrigger } from "../rules/MissingFilterRecordTrigger";

export const DefaultRuleStore: object = {
  ActionCallsInLoop,
  APIVersion,
  AutoLayout,
  CopyAPIName,
  CyclomaticComplexity,
  DMLStatementInLoop,
  DuplicateDMLOperation,
  FlowDescription,
  FlowName,
  GetRecordAllFields,
  HardcodedId,
  HardcodedUrl,
  InactiveFlow,
  MissingFaultPath,
  MissingNullHandler,
  ProcessBuilder,
  RecursiveAfterUpdate,
  SameRecordFieldUpdates,
  SOQLQueryInLoop,
  TriggerOrder,
  UnconnectedElement,
  UnsafeRunningContext,
  UnusedVariable,
};

export const BetaRuleStore: object = {
  MissingMetadataDescription,
  MissingFilterRecordTrigger
};
