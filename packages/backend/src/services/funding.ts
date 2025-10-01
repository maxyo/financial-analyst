import { getRepositories } from '../repositories';

import type { FundingOptions } from '../api/tinkoff/types';
import type { FundingResult } from '../lib/funding/types';

export class FundingService {
  /**
   * Compute accurate funding strictly from DB (funding_rates), no external API calls.
   * Only futures instruments are supported; for non-futures returns an empty result.
   *
   * @param instrument Instrument object (expects instrumentType for futures detection)
   * @param _figi FIGI or ticker (kept for signature compatibility)
   * @param _lastPrice Optional last price (unused in DB mode)
   * @param _vwap Optional VWAP price (unused in DB mode)
   * @param _fundingOpts Funding options (unused in DB mode)
   */
  async computeAccurateFunding(
    instrument: any,
    _figi: string,
    _lastPrice: number | undefined,
    _vwap: number | undefined,
    _fundingOpts?: FundingOptions,
  ): Promise<FundingResult> {
    // Only futures have MoEx-like funding
    if (!instrument || instrument.instrumentType !== 'futures') {
      return {};
    }
    const ticker = String(instrument.ticker || instrument.tickerSymbol || '').toUpperCase();
    if (!ticker) return { fundingMode: 'db' };

    // Touch unused parameters to satisfy strict noUnusedParameters while keeping signature stable
    void _figi; void _lastPrice; void _vwap; void _fundingOpts;

    const repo = getRepositories().fundingRates;
    const row = repo.getLatestByTicker(ticker, 'moex');
    if (!row) {
      return { fundingMode: 'db' };
    }

    // We only return per-unit funding value pulled from DB
    return {
      fundingPerUnit: Number(row.value),
      fundingMode: 'db',
    };
  }
}

export const fundingService = new FundingService();
