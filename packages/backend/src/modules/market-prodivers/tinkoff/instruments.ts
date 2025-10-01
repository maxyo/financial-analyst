import { getApi } from './client';
import type { InstrumentRow } from '../../repositories/instruments';

export type InstrumentCategory = 'shares' | 'futures' | 'bonds' | 'etfs' | 'currencies';

function mapToRow(i: any): InstrumentRow {
  const nowIso = new Date().toISOString();
  return {
    ticker: String(i.ticker || i.tickerSymbol || '').toUpperCase(),
    name: i.name ?? i.title ?? undefined,
    figi: i.figi ?? undefined,
    uid: i.uid ?? undefined,
    lot: i.lot != null ? Number(i.lot) : undefined,
    classCode: i.classCode ?? undefined,
    updatedAt: nowIso,
  };
}

export async function listInstruments(types?: InstrumentCategory[]): Promise<InstrumentRow[]> {
  const api = getApi();
  const categories: InstrumentCategory[] = Array.isArray(types) && types.length
    ? types
    : ['shares', 'futures', 'bonds', 'etfs', 'currencies'];

  const out: InstrumentRow[] = [];

  for (const cat of categories) {
    try {
      switch (cat) {
        case 'shares': {
          const res: any = await api.instruments.shares({});
          const items = Array.isArray(res?.instruments) ? res.instruments : [];
          for (const i of items) out.push(mapToRow(i));
          break;
        }
        case 'futures': {
          const res: any = await api.instruments.futures({});
          const items = Array.isArray(res?.instruments) ? res.instruments : [];
          for (const i of items) out.push(mapToRow(i));
          break;
        }
        case 'bonds': {
          const res: any = await api.instruments.bonds({});
          const items = Array.isArray(res?.instruments) ? res.instruments : [];
          for (const i of items) out.push(mapToRow(i));
          break;
        }
        case 'etfs': {
          const res: any = await api.instruments.etfs({});
          const items = Array.isArray(res?.instruments) ? res.instruments : [];
          for (const i of items) out.push(mapToRow(i));
          break;
        }
        case 'currencies': {
          const res: any = await api.instruments.currencies({});
          const items = Array.isArray(res?.instruments) ? res.instruments : [];
          for (const i of items) out.push(mapToRow(i));
          break;
        }
        default:
          break;
      }
    } catch (e) {
      // Swallow per-category errors to import as much as possible
      // Optionally, could push to a warnings list in future
      continue;
    }
  }

  // Deduplicate by ticker (keep the first occurrence)
  const seen = new Set<string>();
  const dedup: InstrumentRow[] = [];
  for (const r of out) {
    const key = (r.ticker || '').toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    dedup.push(r);
  }

  return dedup;
}
