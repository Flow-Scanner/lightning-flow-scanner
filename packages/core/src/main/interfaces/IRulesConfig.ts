import { IExceptions } from "./IExceptions";
import { IRuleOptions } from "./IRuleOptions";

export enum DetailLevel {
  ENRICHED = 'enriched',
  SIMPLE = 'simple'
}

export interface IRulesConfig {
  betaMode?: boolean;  // Toggles beta rules; defaults to false
  betamode?: boolean;  // Use betaMode instead; to be removed
  detailLevel?: 'enriched' | 'simple' | DetailLevel;
  exceptions?: IExceptions;
  rules?: IRuleOptions; 
  ruleMode?: "merged" | "isolated"; // Defaults to "merged"
}