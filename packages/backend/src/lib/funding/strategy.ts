import type { FundingContext, FundingResult } from './types';

export interface FundingStrategy {
  compute(ctx: FundingContext): Promise<FundingResult>;
}
