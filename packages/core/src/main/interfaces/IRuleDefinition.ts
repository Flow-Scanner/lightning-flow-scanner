import { Flow, RuleResult } from "../internals/internals";
export interface IRuleDefinition {
  description: string;
  docRefs: Array<{ label: string; path: string }>;
  execute(flow: Flow, options?: object, suppressions?: string[]): RuleResult;
  isConfigurable: boolean;
  label: string;
  name: string;
  severity?: string;
  supportedTypes: string[];
  uri?: string;
}