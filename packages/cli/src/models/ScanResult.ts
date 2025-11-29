import { FlatViolation } from "@flow-scanner/lightning-flow-scanner-core";

export type ScanResult = {
  status: number;
  summary: {
    flowsNumber: number;
    results: number;
    message: string;
  };
  results: FlatViolation[];
};