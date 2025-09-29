import { TinkoffInvestApi, Helpers } from 'tinkoff-invest-api';
import { config as configDotenv } from 'dotenv';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata';

configDotenv();

let apiInstance: TinkoffInvestApi | null = null;

function getApi(): TinkoffInvestApi {
  if (apiInstance) return apiInstance;
  const token = process.env.TINKOFF_TOKEN;
  if (!token) {
    throw new Error('TINKOFF_TOKEN not set in environment');
  }
  apiInstance = new TinkoffInvestApi({ token });
  return apiInstance;
}

// ---- Funding helpers (per MoEx documentation) ----
export type FundingOptions = {
  k1?: number; // fraction, e.g., 0.001 for 0.1%
  k2?: number; // fraction, e.g., 0.0015 for 0.15%
  prevBasePrice?: number; // previous evening clearing base price
  d?: number; // deviation D (manual)
  mode?: 'generic' | 'currency' | 'manual';
  cbr?: number; // Central Bank rate (for currency mode)
  windowStart?: string; // e.g., '10:00' (local time)
  windowEnd?: string;   // e.g., '15:30' (local time)
  underlyingPrice?: number; // for generic: use D = vwap - underlyingPrice if d not provided
};

export function computeL1L2(prevBasePrice: number, k1: number, k2: number) {
  const L1 = (k1 || 0) * prevBasePrice;
  const L2 = (k2 || 0) * prevBasePrice;
  return { L1, L2 };
}

export function computeFunding(D: number, L1: number, L2: number): number {
  // funding = MIN(L2; MAX(-L2; MIN(-L1, D) + MAX(L1, D)))
  const min1 = Math.min(-L1, D);
  const max1 = Math.max(L1, D);
  const inner = min1 + max1;
  const cappedLow = Math.max(-L2, inner);
  const capped = Math.min(L2, cappedLow);
  // Small epsilon to avoid -0
  const result = Math.abs(capped) < 1e-12 ? 0 : capped;
  return result;
}

function parseHHMM(s?: string): { h: number; m: number } | null {
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Math.max(0, Math.min(23, Number(m[1])));
  const mm = Math.max(0, Math.min(59, Number(m[2])));
  return { h, m: mm };
}

function vwapInWindow(candles: any[], start: string | undefined, end: string | undefined): number | undefined {
  if (!Array.isArray(candles) || candles.length === 0) return undefined;
  const s = parseHHMM(start) || { h: 10, m: 0 };
  const e = parseHHMM(end) || { h: 15, m: 30 };
  let pv = 0;
  let v = 0;
  for (const c of candles) {
    const t = new Date(c.time || c.t || Date.now());
    const hh = t.getHours();
    const mm = t.getMinutes();
    const inWindow = (hh > s.h || (hh === s.h && mm >= s.m)) && (hh < e.h || (hh === e.h && mm <= e.m));
    if (!inWindow) continue;
    const closeRaw = (c.close as any) ?? (c.c as any);
    const close = closeRaw != null ? Helpers.toNumber(closeRaw) : undefined;
    const vol = Number(c.volume ?? c.v ?? 0);
    if (typeof close === 'number' && Number.isFinite(close) && vol > 0) {
      pv += close * vol;
      v += vol;
    }
  }
  if (v <= 0) return undefined;
  return pv / v;
}

export type Summary = {
  name: string;
  ticker: string;
  figi: string;
  lot: number;
  lastPrice?: number;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  dayHigh?: number;
  dayLow?: number;
  dayOpen?: number;
  changeAbs?: number;
  changePct?: number;
  volumeSum?: number;
  // Funding-related fields (heuristic estimation)
  vwap?: number; // intraday VWAP based on today's 1m candles
  premium?: number; // (lastPrice - vwap) / vwap
  fundingRateEst?: number; // estimated funding per 8h (fraction)
  nextFundingTime?: string; // ISO string for next 00:00/08:00/16:00 UTC cut
  minutesToFunding?: number; // minutes until next funding cut from now
  // MoEx funding per documentation (per 1 unit of underlying)
  fundingPerUnit?: number;
  fundingD?: number;
  fundingL1?: number;
  fundingL2?: number;
  fundingMode?: string; // generic | currency | manual
};

export async function findInstrument(query: string) {
  const api = getApi();
  const res = await api.instruments.findInstrument({ query });
  return res.instruments[0];
}

export async function getUnderlyingSummaryByTicker(ticker: string): Promise<Summary> {
  const api = getApi();
  // Resolve instrument to get classCode for futureBy
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument = found.instruments.find(i => i.ticker.toUpperCase() === ticker.toUpperCase()) || found.instruments[0];
  if (!instrument) throw new Error(`Инструмент не найден по запросу: ${ticker}`);

  // Try to fetch Future details to extract basicAssetPositionUid
  try {
    const { InstrumentIdType } = await import('tinkoff-invest-api/dist/generated/instruments.js');
    const futureResp = await api.instruments.futureBy({
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_TICKER,
      classCode: (instrument as any).classCode || '',
      id: instrument.ticker,
    } as any);
    const fut = (futureResp as any)?.instrument || (futureResp as any)?.future || (futureResp as any);
    const posUid = fut?.basicAssetPositionUid;
    if (!posUid) throw new Error('basicAssetPositionUid not found');

    // Get underlying instrument by position UID
    const instrResp = await api.instruments.getInstrumentBy({
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_POSITION_UID,
      id: posUid,
    } as any);
    const under = (instrResp as any)?.instrument;
    if (!under || !under.ticker) throw new Error('Underlying instrument not found');

    // Reuse existing pipeline by ticker
    return await getSummaryByTicker(under.ticker);
  } catch (e) {
    throw new Error(`Не удалось определить базовый актив: ${(e as any)?.message || e}`);
  }
}

export async function getSummaryByTicker(ticker: string, fundingOpts?: FundingOptions): Promise<Summary> {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument = found.instruments.find(i => i.ticker.toUpperCase() === ticker.toUpperCase()) || found.instruments[0];
  if (!instrument) throw new Error(`Инструмент не найден по запросу: ${ticker}`);

  const { figi, lot, name } = instrument;

  const [lastPriceResp, orderBook] = await Promise.all([
    api.marketdata.getLastPrices({ figi: [], instrumentId: [figi], lastPriceType: 0 }),
    api.marketdata.getOrderBook({ instrumentId: figi, depth: 10 }),
  ]);

  const lastPrice = lastPriceResp.lastPrices?.[0]?.price ? Helpers.toNumber(lastPriceResp.lastPrices[0].price) : undefined;

  let bestBid: number | undefined;
  let bestAsk: number | undefined;
  if (orderBook) {
    bestBid = orderBook.bids?.[0]?.price ? Helpers.toNumber(orderBook.bids[0].price) : undefined;
    bestAsk = orderBook.asks?.[0]?.price ? Helpers.toNumber(orderBook.asks[0].price) : undefined;
  }

  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : undefined;

  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  let dayHigh: number | undefined;
  let dayLow: number | undefined;
  let dayOpen: number | undefined;
  let volumeSum = 0;
  // Funding-related accumulators
  let vwap: number | undefined;
  try {
    const candles = await api.marketdata.getCandles({
      instrumentId: figi,
      from,
      to: now,
      interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
    });
    if (candles?.candles?.length) {
      const hs: number[] = [];
      const ls: number[] = [];
      let vSum = 0;
      let pvSum = 0;
      for (const c of candles.candles) {
        const h = Helpers.toNumber(c.high as any);
        const l = Helpers.toNumber(c.low as any);
        const close = Helpers.toNumber(c.close as any);
        const vol = Number(c.volume || 0);
        if (h != null) hs.push(h);
        if (l != null) ls.push(l);
        volumeSum += vol;
        if (close != null && Number.isFinite(close) && vol > 0) {
          vSum += vol;
          pvSum += close * vol;
        }
      }
      if (hs.length) dayHigh = Math.max(...hs);
      if (ls.length) dayLow = Math.min(...ls);
      const first = candles.candles[0];
      dayOpen = first ? Helpers.toNumber(first.open as any) : undefined;
      if (vSum > 0) vwap = pvSum / vSum;
    }
  } catch (e) {
    // ignore, keep undefineds
  }

  const changeAbs = lastPrice != null && dayOpen != null ? lastPrice - dayOpen : undefined;
  const changePct = changeAbs != null && dayOpen ? (changeAbs / dayOpen) * 100 : undefined;

  // Funding estimation (heuristic): premium to VWAP scaled to 8h interval
  let premium: number | undefined;
  let fundingRateEst: number | undefined;
  let nextFundingTime: string | undefined;
  let minutesToFunding: number | undefined;
  if (vwap != null && lastPrice != null && vwap > 0) {
    premium = (lastPrice - vwap) / vwap; // fraction
    // Simple mapping: 1:1 to 8h rate, but clamp to [-0.003, 0.003] (~±0.3%)
    const raw = premium;
    const clamped = Math.max(-0.003, Math.min(0.003, raw));
    fundingRateEst = clamped;
  }

  // ---- Accurate MoEx funding (per 1 unit) ----
  let fundingPerUnit: number | undefined;
  let fundingD: number | undefined;
  let fundingL1: number | undefined;
  let fundingL2: number | undefined;
  let fundingMode: string | undefined;
  try {
    if (fundingOpts && fundingOpts.k1 != null && fundingOpts.k2 != null && fundingOpts.prevBasePrice != null) {
      const { L1, L2 } = computeL1L2(Number(fundingOpts.prevBasePrice), Number(fundingOpts.k1), Number(fundingOpts.k2));
      fundingL1 = L1;
      fundingL2 = L2;
      const mode = (fundingOpts.mode || 'manual') as 'generic' | 'currency' | 'manual';
      fundingMode = mode;
      if (mode === 'manual' && fundingOpts.d != null) {
        fundingD = Number(fundingOpts.d);
      } else if (mode === 'currency') {
        // D = VWAP(10:00-15:30) - CBR
        // Use today's 1m candles of futures (same figi), but restricted window
        const api = getApi();
        const now2 = new Date();
        const from2 = new Date(now2); from2.setHours(0,0,0,0);
        const candles2 = await api.marketdata.getCandles({ instrumentId: figi, from: from2, to: now2, interval: CandleInterval.CANDLE_INTERVAL_1_MIN });
        const v = vwapInWindow(candles2?.candles || [], fundingOpts.windowStart, fundingOpts.windowEnd);
        if (v != null && fundingOpts.cbr != null) fundingD = v - Number(fundingOpts.cbr);
      } else if (mode === 'generic') {
        // If underlyingPrice provided and we have vwap (intraday), approximate D = vwap - underlying
        if (fundingOpts.underlyingPrice != null && vwap != null) fundingD = vwap - Number(fundingOpts.underlyingPrice);
      }
      if (fundingD != null) {
        fundingPerUnit = computeFunding(Number(fundingD), Number(fundingL1), Number(fundingL2));
      }
    }
  } catch {}

  // Next funding cut at 00:00, 08:00, 16:00 UTC (kept for heuristic info)
  const utcNow = new Date();
  const hour = utcNow.getUTCHours();
  const targets = [0, 8, 16];
  let nextHour = targets.find(h => h > hour);
  if (nextHour == null) nextHour = 24; // next day 00:00
  const next = new Date(Date.UTC(
    utcNow.getUTCFullYear(),
    utcNow.getUTCMonth(),
    utcNow.getUTCDate(),
    nextHour === 24 ? 0 : nextHour,
    0, 0, 0
  ));
  if (nextHour === 24) {
    // advance to next day for 00:00
    next.setUTCDate(next.getUTCDate() + 1);
  }
  nextFundingTime = next.toISOString();
  const diffMs = next.getTime() - utcNow.getTime();
  minutesToFunding = Math.max(0, Math.round(diffMs / 60000));

  return {
    name,
    ticker: instrument.ticker,
    figi,
    lot,
    lastPrice,
    bestBid,
    bestAsk,
    spread,
    dayHigh,
    dayLow,
    dayOpen,
    changeAbs,
    changePct,
    volumeSum,
    vwap,
    premium,
    fundingRateEst,
    nextFundingTime,
    minutesToFunding,
    fundingPerUnit,
    fundingD,
    fundingL1,
    fundingL2,
    fundingMode,
  };
}

export type CandlePoint = { t: string; o?: number; h?: number; l?: number; c?: number; v: number };
export type TradePoint = { t: string; p: number; q?: number; side?: 'buy' | 'sell' | 'unspecified' };

export type OpenPosition = {
  instrumentId?: string;
  figi?: string;
  ticker?: string;
  name?: string;
  lot?: number; // lot size reported by instrument (per contract or share)
  futuresLot?: number; // futures lot if available
  underlyingLot?: number; // underlying lot if available
  effectiveLot?: number; // underlyingLot * futuresLot if applicable
  quantity?: number; // number of contracts (for futures) or units
  averagePrice?: number; // average price per contract/unit (as reported by API)
  lastPrice?: number; // last market price per contract/unit
  pnl?: number; // (last - avg) * quantity (approximate)
  positionUnits?: number; // quantity * effectiveLot (for futures), else quantity
  notional?: number; // lastPrice * quantity (per contract). For futures underlying notional can be lastPrice*quantity*effectiveLot
  instrumentType?: string; // e.g., share, bond, futures, currency
};

export async function getOpenPositions(accountId?: string): Promise<OpenPosition[]> {
  const api = getApi();
  // Determine account id: param -> env -> first account
  try {
    // @ts-ignore
    const acc = accountId || process.env.TINKOFF_ACCOUNT_ID || (await api.users.getAccounts({})).accounts?.[0]?.id;



    if (!acc) return [];

    // Try portfolio first
    let positionsRaw: any[] = [];
    try {
      const p = await api.operations.getPortfolio({ accountId: acc } as any);
      positionsRaw = (p as any).positions || (p as any).portfolio?.positions || [];
    } catch {
      try {
        const p2 = await api.operations.getPositions({ accountId: acc } as any);
        positionsRaw = (p2 as any).securities || (p2 as any).positions || [];
      } catch {}
    }
    if (!Array.isArray(positionsRaw) || positionsRaw.length === 0) return [];

    // Collect instrument identifiers
    const ids: string[] = [];
    const byIdx: { [k: string]: any } = {};
    const idTypeEnum = (await import('tinkoff-invest-api/dist/generated/instruments.js')).InstrumentIdType;

    for (const p of positionsRaw) {
      const figi = (p as any).figi;
      const instrumentId = (p as any).instrumentId || (p as any).instrumentUid || undefined;
      const key = instrumentId || figi;
      if (!key) continue;
      if (!ids.includes(key)) ids.push(key);
      byIdx[key] = p;
    }
    if (ids.length === 0) return [];

    // Fetch instrument details and last prices in batch
    const details: { [k: string]: any } = {};
    for (const key of ids) {
      try {
        let resp: any;
        if (key && key.length === 12 && /^[A-Z0-9]{12}$/.test(key)) {
          resp = await api.instruments.getInstrumentBy({ idType: idTypeEnum.INSTRUMENT_ID_TYPE_FIGI, id: key } as any);
        } else {
          resp = await api.instruments.getInstrumentBy({ idType: idTypeEnum.INSTRUMENT_ID_TYPE_UID, id: key } as any);
        }
        const inst = (resp as any)?.instrument;
        if (inst) details[key] = inst;
      } catch {}
    }

    // Last prices: use instrumentId when possible
    const lastPricesResp = await api.marketdata.getLastPrices({ figi: [], instrumentId: ids, lastPriceType: 0 } as any);
    const lastMap: { [k: string]: number } = {};
    for (const lp of (lastPricesResp as any).lastPrices || []) {
      const id = lp.instrumentId || lp.instrumentUid || lp.figi;
      if (!id) continue;
      const price = lp.price ? Helpers.toNumber(lp.price) : undefined;
      if (price != null) lastMap[id] = price;
    }

    // Compose simplified positions
    const result: OpenPosition[] = [];
    for (const key of ids) {
      const p = byIdx[key] || {};
      const inst = details[key] || {};
      const lot = Number(inst.lot || inst.lotSize || 1) || 1;
      const instrumentType = String(inst.instrumentType || inst.type || inst.kind || '');
      const futuresLot = Number(inst.lot || inst.lotSize || 1) || 1; // as contract lot
      const underlyingLot = Number(inst.basicAssetSize || inst.basicAssetLot || inst.dlvBaseAssetSize || 1) || 1; // best-effort
      const effectiveLot = instrumentType.toLowerCase().includes('futures') || instrumentType.toLowerCase().includes('future')
        ? (underlyingLot * futuresLot)
        : lot;
      const quantity = (() => {
        const q = (p as any).quantity || (p as any).balance || (p as any).quantityLots;
        const n = Helpers.toNumber(q as any);
        return Number.isFinite(n) ? n : undefined;
      })();
      const avg = (() => {
        const a = (p as any).averagePositionPriceFifo || (p as any).averagePositionPrice || (p as any).averagePositionPricePt;
        const n = Helpers.toNumber(a as any);
        return Number.isFinite(n) ? n : undefined;
      })();
      const last = (() => {
        // Try from portfolio first, else from lastPrices
        const a = (p as any).currentPrice;
        const n = Helpers.toNumber(a as any);
        if (Number.isFinite(n)) return n;
        const lp = lastMap[key];
        if (Number.isFinite(lp)) return lp;
        return undefined;
      })();
      let pnl: number | undefined = undefined;
      if (quantity != null && avg != null && last != null) pnl = (last - avg) * Number(quantity);

      const positionUnits = (quantity != null && effectiveLot != null) ? Number(quantity) * Number(effectiveLot) : quantity;
      const notional = (() => {
        if (last == null || quantity == null) return undefined;
        // last is per contract or unit as reported by API; for futures, show underlying notional too
        const base = Number(last) * Number(quantity);
        if (effectiveLot && (instrumentType.toLowerCase().includes('futures') || instrumentType.toLowerCase().includes('future'))) {
          return base * Number(effectiveLot);
        }
        return base;
      })();

      result.push({
        instrumentId: inst.instrumentId || inst.uid || key,
        figi: inst.figi,
        ticker: inst.ticker,
        name: inst.name,
        lot,
        futuresLot,
        underlyingLot,
        effectiveLot,
        quantity,
        averagePrice: avg,
        lastPrice: last,
        pnl,
        positionUnits,
        notional,
        instrumentType,
      });
    }

    // Only keep non-zero quantities
    return result.filter(r => r.quantity && Math.abs(Number(r.quantity)) > 0);
  } catch (e) {

    throw e
  }
}

export async function getTodayCandlesByTicker(ticker: string): Promise<CandlePoint[]> {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument = found.instruments.find(i => i.ticker.toUpperCase() === ticker.toUpperCase()) || found.instruments[0];
  if (!instrument) throw new Error(`Инструмент не найден по запросу: ${ticker}`);
  const { figi } = instrument;

  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  const candles = await api.marketdata.getCandles({
    instrumentId: figi,
    from,
    to: now,
    interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
  });

  const points: CandlePoint[] = [];
  for (const c of candles.candles || []) {
    points.push({
      t: (c.time || new Date()).toISOString(),
      o: Helpers.toNumber(c.open as any),
      h: Helpers.toNumber(c.high as any),
      l: Helpers.toNumber(c.low as any),
      c: Helpers.toNumber(c.close as any),
      v: Number(c.volume || 0),
    });
  }
  return points;
}

export async function getRecentTradesByTicker(ticker: string): Promise<TradePoint[]> {
  // Deprecated for user-specific view; kept for fallback to public market trades
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument = found.instruments.find(i => i.ticker.toUpperCase() === ticker.toUpperCase()) || found.instruments[0];
  if (!instrument) throw new Error(`Инструмент не найден по запросу: ${ticker}`);
  const { figi } = instrument;

  const now = new Date();
  const from = new Date(now.getTime() - 60 * 60 * 1000); // last hour

  const resp: any = await (api as any).marketdata.getLastTrades({
    instrumentId: figi,
    from,
    to: now,
    tradeSource: 3, // TRADE_SOURCE_ALL
  } as any);

  const arr = Array.isArray(resp?.trades) ? resp.trades : [];
  const out: TradePoint[] = [];
  for (const t of arr) {
    const time = (t.time || new Date()).toISOString();
    const price = Helpers.toNumber(t.price as any);
    // Skip invalid/non-finite prices; do not throw to avoid breaking the endpoint
    if (!Number.isFinite(price)) continue;
    const qty = Number(t.quantity || 0);
    const dir = Number((t.direction as any) ?? 0);
    const side = dir === 1 ? 'buy' : dir === 2 ? 'sell' : 'unspecified';
    out.push({ t: time, p: price, q: Number.isFinite(qty) ? qty : undefined, side });
  }
  out.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return out;
}

export async function getUserTradesByTicker(ticker: string, accountId?: string, hours: number = 24): Promise<TradePoint[]> {
  const api = getApi();
  // Resolve instrument
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument = found.instruments.find(i => i.ticker.toUpperCase() === ticker.toUpperCase()) || found.instruments[0];
  if (!instrument) throw new Error(`Инструмент не найден по запросу: ${ticker}`);
  const figi = (instrument as any).figi as string;
  const instrumentUid = (instrument as any).instrumentUid || (instrument as any).uid;

  // Determine account id
  // @ts-ignore
  const acc = accountId || process.env.TINKOFF_ACCOUNT_ID || (await api.users.getAccounts({})).accounts?.[0]?.id;
  if (!acc) return [];

  const now = new Date();
  const from = new Date(now.getTime() - Math.max(1, hours) * 60 * 60 * 1000);

  // Try modern cursor API first, fallback to legacy getOperations
  let items: any[] = [];
  try {
    const req: any = {
      accountId: acc,
      from,
      to: now,
      // instrumentId accepts figi or instrument_uid per docs
      instrumentId: instrumentUid || figi,
      // states filter if available in cursor API; ignore if unsupported
      // state: 2 (EXECUTED)
    };
    const page: any = await (api as any).operations.getOperationsByCursor(req);
    const arr = page?.items || page?.operations || [];
    if (Array.isArray(arr)) items = arr;
  } catch (_) {
    try {
      const resp: any = await (api as any).operations.getOperations({
        accountId: acc,
        from,
        to: now,
        state: 2, // OPERATION_STATE_EXECUTED
        figi,
      });
      const arr = resp?.operations || resp?.items || [];
      if (Array.isArray(arr)) items = arr;
    } catch (e) {
      items = [];
    }
  }

  const out: TradePoint[] = [];
  for (const op of items) {
    // Filter by instrument match
    const opFigi = (op.figi || op.instrumentFigi || op.instrumentId || op.instrumentUid) as string | undefined;
    if (opFigi && figi && opFigi !== figi) {
      // Some cursor responses might return other instruments if filter unsupported; skip
      continue;
    }
    // Only take trades (Buy/Sell) and executed operations
    const typeStr = String(op.operationType || op.type || '').toUpperCase();
    const isBuy = typeStr.includes('BUY') && !typeStr.includes('DIVIDEND');
    const isSell = typeStr.includes('SELL');
    if (!isBuy && !isSell) continue;

    const time: string = (op.date || op.time || op.doneAt || new Date()).toISOString?.() || new Date(op.date || op.time || op.doneAt || new Date()).toISOString();

    // Price and quantity normalization
    const price = (() => {
      const p = (op.price || op.averagePositionPrice || op.paymentPerShare || op.dealPrice || op.executionPrice) as any;
      const n = Helpers.toNumber(p as any);
      if (Number.isFinite(n)) return n;
      const np = (op as any).pricePerShare; // Quotation
      const n2 = Helpers.toNumber(np as any);
      return Number.isFinite(n2) ? n2 : undefined;
    })();
    if (!Number.isFinite(price as number)) continue;

    const qty = (() => {
      const q = (op.quantity || op.quantityExecuted || op.lots || op.lotsExecuted || op.quantityLots);
      const n = Number(q);
      return Number.isFinite(n) ? n : undefined;
    })();

    const side: 'buy' | 'sell' = isBuy ? 'buy' : 'sell';
    out.push({ t: time, p: price as number, q: qty, side });
  }

  out.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return out;
}
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument = found.instruments.find(i => i.ticker.toUpperCase() === ticker.toUpperCase()) || found.instruments[0];
  if (!instrument) throw new Error(`Инструмент не найден по запросу: ${ticker}`);
  const { figi } = instrument;

  const now = new Date();
  const from = new Date(now.getTime() - 60 * 60 * 1000); // last hour

  const resp: any = await (api as any).marketdata.getLastTrades({
    instrumentId: figi,
    from,
    to: now,
    tradeSource: 3, // TRADE_SOURCE_ALL
  } as any);

  const arr = Array.isArray(resp?.trades) ? resp.trades : [];
  const out: TradePoint[] = [];
  for (const t of arr) {
    const time = (t.time || new Date()).toISOString();
    const price = Helpers.toNumber(t.price as any);
    // Skip invalid/non-finite prices; do not throw to avoid breaking the endpoint
    if (!Number.isFinite(price)) continue;
    const qty = Number(t.quantity || 0);
    const dir = Number((t.direction as any) ?? 0);
    const side = dir === 1 ? 'buy' : dir === 2 ? 'sell' : 'unspecified';
    out.push({ t: time, p: price, q: Number.isFinite(qty) ? qty : undefined, side });
  }
  out.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return out;
}
