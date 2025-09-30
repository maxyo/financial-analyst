import { Helpers } from 'tinkoff-invest-api';
import { OperationType } from 'tinkoff-invest-api/dist/generated/operations';

import { getApi } from './client';

import type { TradePoint } from './types';

export async function getRecentTradesByTicker(
  ticker: string,
): Promise<TradePoint[]> {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument =
    found.instruments.find(
      (i) => i.ticker.toUpperCase() === ticker.toUpperCase(),
    ) || found.instruments[0];
  if (!instrument)
    {throw new Error(`Инструмент не найден по запросу: ${ticker}`);}
  const { figi } = instrument;

  const now = new Date();
  // const from = new Date(now.getTime() - 60 * 60 * 1000); // last hour (not used by API call here)

  const resp: any = await (api).marketdata.getLastTrades({
    instrumentId: figi,
    // from,
    to: now,
    tradeSource: 3, // TRADE_SOURCE_ALL
  });

  const arr = Array.isArray(resp?.trades) ? resp.trades : [];
  const out: TradePoint[] = [];
  for (const t of arr) {
    const time = (t.time || new Date()).toISOString();
    const price = Helpers.toNumber(t.price);
    if (!Number.isFinite(price) || !price) continue;
    const qty = Number(t.quantity || 0);
    const dir = Number((t.direction) ?? 0);
    const side = dir === 1 ? 'buy' : dir === 2 ? 'sell' : 'unspecified';
    out.push({
      t: time,
      p: price,
      q: Number.isFinite(qty) ? qty : undefined,
      side,
    });
  }
  out.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return out;
}

export async function getUserTradesByTicker(
  ticker: string,
  accountId?: string,
  hours = 24,
): Promise<TradePoint[]> {
  const api = getApi();
  const found = await api.instruments.findInstrument({ query: ticker });
  const instrument =
    found.instruments.find(
      (i) => i.ticker.toUpperCase() === ticker.toUpperCase(),
    ) || found.instruments[0];
  if (!instrument)
    {throw new Error(`Инструмент не найден по запросу: ${ticker}`);}
  const figi = (instrument).figi;
  const instrumentUid = (instrument).uid;

  const acc =
    accountId ||
    process.env.TINKOFF_ACCOUNT_ID ||
    (await api.users.getAccounts({})).accounts?.[0]?.id;
  if (!acc) return [];

  const now = new Date();
  const from = new Date(now.getTime() - Math.max(1, hours) * 60 * 60 * 1000);

  let items: any[] = [];
  try {
    const page: any = await api.operations.getOperationsByCursor({
      accountId: acc,
      from,
      to: now,
      instrumentId: instrumentUid || figi,
      operationTypes: [
        OperationType.OPERATION_TYPE_SELL,
        OperationType.OPERATION_TYPE_BUY,
      ],
    });
    const arr = page?.items || page?.operations || [];
    if (Array.isArray(arr)) items = arr;
  } catch (_) {
    try {
      const resp: any = await (api).operations.getOperations({
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
    const opFigi = (op.figi ||
      op.instrumentFigi ||
      op.instrumentId ||
      op.instrumentUid) as string | undefined;
    if (opFigi && figi && opFigi !== figi) {
      continue;
    }
    const isBuy = op.type === OperationType.OPERATION_TYPE_BUY;
    const isSell = op.type === OperationType.OPERATION_TYPE_SELL;
    if (!isBuy && !isSell) continue;

    const time: string =
      (op.date || op.time || op.doneAt || new Date()).toISOString?.() ||
      new Date(op.date || op.time || op.doneAt || new Date()).toISOString();

    const price = (() => {
      const p = (op.price ||
        op.averagePositionPrice ||
        op.paymentPerShare ||
        op.dealPrice ||
        op.executionPrice);
      const n = Helpers.toNumber(p);
      if (Number.isFinite(n)) return n;
      const np = (op).pricePerShare; // Quotation
      const n2 = Helpers.toNumber(np);
      return Number.isFinite(n2) ? n2 : undefined;
    })();
    if (!Number.isFinite(price as number)) continue;

    const qty = (() => {
      const q =
        op.quantity ||
        op.quantityExecuted ||
        op.lots ||
        op.lotsExecuted ||
        op.quantityLots;
      const n = Number(q);
      return Number.isFinite(n) ? n : undefined;
    })();

    const side: 'buy' | 'sell' = isBuy ? 'buy' : 'sell';
    out.push({ t: time, p: price as number, q: qty, side });
  }

  out.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return out;
}
