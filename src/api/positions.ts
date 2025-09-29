import { Helpers } from 'tinkoff-invest-api';

import { getApi } from './client';
import { instrumentService } from '../lib/instrument';

import type { OpenPosition } from './types';

export async function getOpenPositions(
  ticker: string,
  accountId?: string,
): Promise<OpenPosition[]> {
  const api = getApi();
  try {
    const acc =
      accountId ||
      process.env.TINKOFF_ACCOUNT_ID ||
      (await api.users.getAccounts({})).accounts?.[0]?.id;

    if (!acc) return [];
    const found = await api.instruments.findInstrument({ query: ticker });
    const instrument =
      found.instruments.find(
        (i) => i.ticker.toUpperCase() === ticker.toUpperCase(),
      ) || found.instruments[0];

    let positionsRaw: any[] = [];
    try {
      const p = await api.operations.getPortfolio({ accountId: acc } as any);
      positionsRaw =
        (p as any).positions || (p as any).portfolio?.positions || [];
    } catch {
      try {
        const p2 = await api.operations.getPositions({ accountId: acc } as any);
        positionsRaw = (p2 as any).securities || (p2 as any).positions || [];
      } catch {}
    }
    if (!Array.isArray(positionsRaw) || positionsRaw.length === 0) return [];

    const ids: string[] = [];
    const byIdx: Record<string, any> = {};
    const idTypeEnum = (
      await import('tinkoff-invest-api/dist/generated/instruments.js')
    ).InstrumentIdType;

    for (const p of positionsRaw) {
      const figi = (p).figi;
      const instrumentId =
        (p).instrumentId || (p).instrumentUid || undefined;
      const key = instrumentId || figi;
      if (p.instrumentUid !== (instrument as any).uid) continue;
      if (!key) continue;
      if (!ids.includes(key)) ids.push(key);
      byIdx[key] = p;
    }
    if (ids.length === 0) return [];

    const details: Record<string, any> = {};
    for (const key of ids) {
      try {
        let resp: any;
        if (key && key.length === 12 && /^[A-Z0-9]{12}$/.test(key)) {
          resp = await api.instruments.getInstrumentBy({
            idType: idTypeEnum.INSTRUMENT_ID_TYPE_FIGI,
            id: key,
          } as any);
        } else {
          resp = await api.instruments.getInstrumentBy({
            idType: idTypeEnum.INSTRUMENT_ID_TYPE_UID,
            id: key,
          } as any);
        }
        const inst = (resp)?.instrument;
        if (inst) details[key] = inst;
      } catch {}
    }

    const lastPricesResp = await api.marketdata.getLastPrices({
      figi: [],
      instrumentId: ids,
      lastPriceType: 0,
    } as any);
    const lastMap: Record<string, number> = {};
    for (const lp of (lastPricesResp as any).lastPrices || []) {
      const id = lp.instrumentId || lp.instrumentUid || lp.figi;
      if (!id) continue;
      const price = lp.price ? Helpers.toNumber(lp.price) : undefined;
      if (price != null) lastMap[id] = price;
    }

    const result: OpenPosition[] = [];
    for (const key of ids) {
      const underlyingInstrument = await instrumentService.getBaseInstrument(key);
      const p = byIdx[key] || {};
      const inst = details[key] || {};
      const lot = Number(inst.lot || inst.lotSize || 1) || 1;
      const instrumentType = String(
        inst.instrumentType || inst.type || inst.kind || '',
      );
      const futuresLot = Number(inst.lot || inst.lotSize || 1) || 1;
      const underlyingLot = Number(underlyingInstrument?.lot) || 1;
      const effectiveLot =
        instrumentType.toLowerCase().includes('futures') ||
        instrumentType.toLowerCase().includes('future')
          ? underlyingLot * futuresLot
          : lot;
      const quantity = (() => {
        const q =
          (p).quantity || (p).balance || (p).quantityLots;
        const n = Helpers.toNumber(q);
        return Number.isFinite(n) ? n : undefined;
      })();
      const avg = (() => {
        const a =
          (p).averagePositionPriceFifo ||
          (p).averagePositionPrice ||
          (p).averagePositionPricePt;
        const n = Helpers.toNumber(a);
        return Number.isFinite(n) ? n : undefined;
      })();
      const last = (() => {
        const a = (p).currentPrice;
        const n = Helpers.toNumber(a);
        if (Number.isFinite(n)) return n;
        const lp = lastMap[key];
        if (Number.isFinite(lp)) return lp;
        return undefined;
      })();
      let pnl: number | undefined = undefined;
      if (quantity != null && avg != null && last != null)
        {pnl = (last - avg) * Number(quantity * effectiveLot);}

      const positionUnits =
        quantity != null && effectiveLot != null
          ? Number(quantity) * Number(effectiveLot)
          : quantity;
      const notional = (() => {
        if (last == null || quantity == null) return undefined;
        const base = Number(last) * Number(quantity);
        if (
          effectiveLot &&
          (instrumentType.toLowerCase().includes('futures') ||
            instrumentType.toLowerCase().includes('future'))
        ) {
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

    return result.filter((r) => r.quantity && Math.abs(Number(r.quantity)) > 0);
  } catch (e) {
    throw e;
  }
}
