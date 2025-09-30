import type { FundingOptions } from '../../api/types';

export interface FundingResult {
  fundingPerUnit?: number;
  fundingD?: number;
  fundingL1?: number;
  fundingL2?: number;
  fundingMode?: string;
}

export interface FundingContext {
  // Identifiers and prices
  instrument: any;
  figi: string;
  lastPrice?: number;
  vwap?: number;
  // Options provided by caller
  options: FundingOptions;
}
