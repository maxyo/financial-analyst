import { FundingContext, type FundingResult } from './types';
import { moexService } from '../../api/moex';

export async function getMoexFR(ctx: FundingContext): Promise<FundingResult> {
  const fundingMode = 'moex';
  try {
    const ticker = ctx.instrument?.ticker || '';
    if (!ticker) return { fundingMode };
    const security = `${String(ticker).toUpperCase()}.hs`;
    const points = await moexService.getFunding(security, 50, 1);
    if (!Array.isArray(points) || points.length === 0) return { fundingMode };
    let lastVal: number | undefined;
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      const v = Array.isArray(p) ? p[1] : undefined;
      if (typeof v === 'number' && Number.isFinite(v)) {
        lastVal = v;
        break;
      }
    }
    if (lastVal == null) return { fundingMode };
    return { fundingPerUnit: lastVal, fundingMode };
  } catch (e) {
    console.error('getMoexFR failed:', e);
    return { fundingMode };
  }
}
