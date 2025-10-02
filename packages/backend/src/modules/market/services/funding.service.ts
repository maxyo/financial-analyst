import { Injectable } from '@nestjs/common';

import { FundingResult } from '../../../types/funding';
import { FundingRatesRepository } from '../repositories/funding-rates.repository';

interface InstrumentLike {
  instrumentType?: string;
  ticker?: string;
  tickerSymbol?: string;
}

@Injectable()
export class FundingNestService {
  constructor(private readonly repository: FundingRatesRepository) {}
  /**
   * Compute funding for a given instrument and time. Only futures are supported (MoEx-like funding).
   */
  async getFunding(
    instrument: InstrumentLike | null | undefined,
    time: Date,
  ): Promise<FundingResult | null> {
    // Only futures have MoEx-like funding
    if (!instrument || instrument.instrumentType !== 'futures') {
      return null;
    }
    const ticker = String(
      instrument.ticker || instrument.tickerSymbol || '',
    ).toUpperCase();
    if (!ticker) return { fundingPerUnit: 0, fundingMode: 'db' };

    const row = await this.repository.findOne({
      where: { ticker, source: 'moex', ts: time.getTime() },
    });
    if (!row) {
      return { fundingPerUnit: 0, fundingMode: 'db' };
    }

    return {
      fundingPerUnit: Number(row.value),
      fundingMode: 'db',
    };
  }
}
