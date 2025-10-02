import { Injectable } from '@nestjs/common';
import { TinkoffInvestApi } from 'tinkoff-invest-api';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata';

export declare enum InstrumentIdType {
  /** INSTRUMENT_ID_UNSPECIFIED - Значение не определено. */
  INSTRUMENT_ID_UNSPECIFIED = 0,
  /** INSTRUMENT_ID_TYPE_FIGI - FIGI. */
  INSTRUMENT_ID_TYPE_FIGI = 1,
  /** INSTRUMENT_ID_TYPE_TICKER - Ticker. */
  INSTRUMENT_ID_TYPE_TICKER = 2,
  /** INSTRUMENT_ID_TYPE_UID - Уникальный идентификатор. */
  INSTRUMENT_ID_TYPE_UID = 3,
  /** INSTRUMENT_ID_TYPE_POSITION_UID - Идентификатор позиции. */
  INSTRUMENT_ID_TYPE_POSITION_UID = 4,
  UNRECOGNIZED = -1
}

export type InstrumentCategory =
  | 'shares'
  | 'futures'
  | 'bonds'
  | 'etfs'
  | 'currencies';

@Injectable()
export class TinkoffApiService {
  private api: TinkoffInvestApi | null = null;

  constructor() {
  }

  get client(): TinkoffInvestApi {
    if (this.api) return this.api;
    const token = process.env.TINKOFF_TOKEN;
    if (!token) {
      throw new Error('TINKOFF_TOKEN is required to initialize Tinkoff API');
    }
    this.api = new TinkoffInvestApi({ token });
    return this.api;
  }

  // Lightweight helpers to avoid leaking SDK details all over the app
  findInstrument(query: string) {
    return this.client.instruments.findInstrument({ query });
  }

  getInstrumentBy(params: {
    id: string;
    idType: InstrumentIdType;
    classCode?: string;
  }) {
    return this.client.instruments.getInstrumentBy(params);
  }

  futureBy(params: {
    idType: InstrumentIdType;
    id: string;
    classCode?: string;
  }) {
    return this.client.instruments.futureBy(params);
  }

  marketdataGetCandles(args: {
    instrumentId: string;
    from: Date;
    to: Date;
    interval: CandleInterval;
  }) {
    return this.client.marketdata.getCandles(args);
  }

  async listInstruments(categories?: InstrumentCategory[]) {
    const kinds =
      categories && categories.length
        ? categories
        : ([
            'shares',
            'futures',
            'bonds',
            'etfs',
            'currencies',
          ] as InstrumentCategory[]);
    const rows: Array<{
      ticker: string;
      name?: string | null;
      figi?: string | null;
      uid?: string | null;
      lot?: number | null;
      classCode?: string | null;
    }> = [];

    for (const k of kinds) {
      try {
        if (k === 'shares') {
          const r = await this.client.instruments.shares({
            instrumentStatus: 1 as any,
          });
          for (const i of r.instruments) {
            rows.push({
              ticker: i.ticker,
              name: i.name,
              figi: i.figi,
              uid: i.uid,
              lot: (i.lot as any) ?? null,
              classCode: i.classCode,
            });
          }
        } else if (k === 'futures') {
          const r = await this.client.instruments.futures({});
          for (const i of r.instruments) {
            rows.push({
              ticker: i.ticker,
              name: i.name,
              figi: i.figi,
              uid: i.uid,
              lot: (i.lot as any) ?? null,
              classCode: i.classCode,
            });
          }
        } else if (k === 'bonds') {
          const r = await this.client.instruments.bonds({
            instrumentStatus: 1 as any,
          });
          for (const i of r.instruments) {
            rows.push({
              ticker: i.ticker,
              name: i.name,
              figi: i.figi,
              uid: i.uid,
              lot: (i.lot as any) ?? null,
              classCode: i.classCode,
            });
          }
        } else if (k === 'etfs') {
          const r = await this.client.instruments.etfs({
            instrumentStatus: 1 as any,
          });
          for (const i of r.instruments) {
            rows.push({
              ticker: i.ticker,
              name: i.name,
              figi: i.figi,
              uid: i.uid,
              lot: (i.lot as any) ?? null,
              classCode: i.classCode,
            });
          }
        } else if (k === 'currencies') {
          const r = await this.client.instruments.currencies({
            instrumentStatus: 1 as any,
          });
          for (const i of r.instruments) {
            rows.push({
              ticker: i.ticker,
              name: i.name,
              figi: i.figi,
              uid: i.uid,
              lot: (i.lot as any) ?? null,
              classCode: i.classCode,
            });
          }
        }
      } catch {
        // ignore category errors
      }
    }

    // Deduplicate by ticker
    const map = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
      const t = String(r.ticker || '').toUpperCase();
      if (!t) continue;
      if (!map.has(t)) map.set(t, r);
    }
    return Array.from(map.values());
  }
}
