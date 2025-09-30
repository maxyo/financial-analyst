import { computeGeneric } from './generic';
import { getMoexFR } from './moex';

import type { FundingContext, FundingResult } from './types';
import type { FundingOptions } from '../../api/types';

export async function computeAccurateFunding(
  instrument: any,
  figi: string,
  lastPrice: number | undefined,
  vwap: number | undefined,
  fundingOpts?: FundingOptions,
): Promise<FundingResult> {
  if(instrument.instrumentType !== 'futures') {
    return {};
  }

  if (!fundingOpts) return {};
  const mode = fundingOpts.mode || 'generic';
  const ctx: FundingContext = {
    instrument,
    figi,
    lastPrice,
    vwap,
    options: fundingOpts,
  };

  if (mode === 'moex') return getMoexFR(ctx);
  return computeGeneric(ctx);
}

export default { computeAccurateFunding };
