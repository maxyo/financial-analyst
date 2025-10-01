import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';

import {
  getSummaryByTicker,
  getTodayCandlesByTicker,
  getUnderlyingSummaryByTicker,
  getRecentTradesByTicker,
} from '../api';
import { computeMoexClearingInstants } from '../lib/calculations';
import { errorMessage } from '../utils/http';
import type { CandlePoint } from '../api/tinkoff/types';

interface ClearingPoint {
  t: string;
  fundingRateEst?: number;
}
interface HeartbeatWS extends WebSocket {
  isAlive?: boolean;
}

type WSMessageType = 'subscribe' | 'unsubscribe' | 'ping';
interface WSMessage {
  type: WSMessageType;
  ticker?: string;
}

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const tickerSubs = new Map<string, Set<WebSocket>>();
  const clientSubs = new WeakMap<WebSocket, Set<string>>();
  const pollers = new Map<string, NodeJS.Timeout>();
  const INTERVAL_MS = Number(process.env.QUOTE_POLL_MS || 2000);

  const CANDLES_POLL_MS = Number(process.env.CANDLES_POLL_MS || 5000);
  const lastCandleTs = new Map<string, string>();
  const lastCandlesPollAt = new Map<string, number>();

  const TRADES_POLL_MS = Number(process.env.TRADES_POLL_MS || 10000);
  const lastTradesPollAt = new Map<string, number>();

  async function sendCandlesSnapshot(ws: WebSocket, ticker: string) {
    try {
      const points = await getTodayCandlesByTicker(ticker);
      const last = Array.isArray(points) && points.length ? points[points.length - 1] : null;
      if (last?.t) lastCandleTs.set(ticker, last.t);
      let clearings: ClearingPoint[] = [];
      try {
        const instants = computeMoexClearingInstants();
        const s = await getSummaryByTicker(ticker);
        const envK2 = process.env.FUNDING_K2;
        const k2 = envK2 != null ? Number(envK2) : undefined;
        let basePrice: number | undefined;
        if (s.fundingL2 != null && k2) basePrice = Number(s.fundingL2) / Number(k2);
        if (basePrice == null || !Number.isFinite(basePrice) || basePrice <= 0) {
          basePrice = s.vwap != null ? Number(s.vwap) : s.lastPrice != null ? Number(s.lastPrice) : undefined;
        }
        const fundingFraction =
          s.fundingPerUnit != null && basePrice != null && Number(basePrice) > 0
            ? Number(s.fundingPerUnit) / Number(basePrice)
            : s.fundingRateEst;
        clearings = instants.map((t) => ({ t, fundingRateEst: fundingFraction }));
      } catch {
        // ignore
      }
      const payload = JSON.stringify({ type: 'candles', ticker, mode: 'snapshot', points, clearings, ts: new Date().toISOString() });
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch {}
      }
    } catch (e: unknown) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(
            JSON.stringify({ type: 'error', ticker, message: errorMessage(e, 'failed to fetch candles') }),
          );
        } catch {}
      }
    }
  }

  function subscribeClientTo(ws: WebSocket, ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    if (!tickerSubs.has(t)) tickerSubs.set(t, new Set());
    tickerSubs.get(t)!.add(ws);
    if (!clientSubs.has(ws)) clientSubs.set(ws, new Set());
    clientSubs.get(ws)!.add(t);
    ensurePoller(t);
    try {
      void sendCandlesSnapshot(ws, t);
    } catch {}
  }

  function unsubscribeClientFrom(ws: WebSocket, ticker: string) {
    const t = ticker.trim().toUpperCase();
    tickerSubs.get(t)?.delete(ws);
    clientSubs.get(ws)?.delete(t);
    cleanupPollerIfIdle(t);
  }

  function cleanupClient(ws: WebSocket) {
    const subs = clientSubs.get(ws);
    if (!subs) return;
    for (const t of subs) {
      tickerSubs.get(t)?.delete(ws);
      cleanupPollerIfIdle(t);
    }
    clientSubs.delete(ws);
  }

  function cleanupPollerIfIdle(ticker: string) {
    const set = tickerSubs.get(ticker);
    if (!set || set.size === 0) {
      const h = pollers.get(ticker);
      if (h) {
        clearInterval(h);
        pollers.delete(ticker);
      }
      tickerSubs.delete(ticker);
    }
  }

  function ensurePoller(ticker: string) {
    if (pollers.has(ticker)) return;
    const h: NodeJS.Timeout = setInterval(async () => {
      // 1) Quotes update
      try {
        const data = await getSummaryByTicker(ticker);
        let underlying: any = undefined;
        try {
          underlying = await getUnderlyingSummaryByTicker(ticker);
        } catch (_) {
          underlying = undefined;
        }
        const payload = JSON.stringify({ type: 'quote', ticker, summary: data, underlying, ts: new Date().toISOString() });
        const clients = tickerSubs.get(ticker);
        if (clients) {
          for (const c of clients) {
            if (c.readyState === WebSocket.OPEN) {
              try {
                c.send(payload);
              } catch {}
            }
          }
        }
      } catch (e: unknown) {
        const clients = tickerSubs.get(ticker);
        const payload = JSON.stringify({ type: 'error', ticker, message: errorMessage(e, 'failed to fetch quote') });
        if (clients) {
          for (const c of clients) {
            if (c.readyState === WebSocket.OPEN) {
              try {
                c.send(payload);
              } catch {}
            }
          }
        }
      }

      // 2) Candles update (rate-limited)
      const now = Date.now();
      const lastAt = lastCandlesPollAt.get(ticker) || 0;
      if (now - lastAt >= CANDLES_POLL_MS) {
        try {
          const all = await getTodayCandlesByTicker(ticker);
          if (Array.isArray(all) && all.length) {
            const lastSentIso = lastCandleTs.get(ticker);
            let toSend: CandlePoint[] = [];
            if (!lastSentIso) {
              toSend = [all[all.length - 1]];
            } else {
              const lastMs = Date.parse(lastSentIso);
              toSend = all.filter((c) => {
                const ms = Date.parse(c.t);
                return Number.isFinite(ms) && ms >= lastMs;
              });
            }
            if (toSend.length) {
              const payload2 = JSON.stringify({ type: 'candles', ticker, mode: 'update', points: toSend, ts: new Date().toISOString() });
              const clients = tickerSubs.get(ticker);
              if (clients) {
                for (const c of clients) {
                  if (c.readyState === WebSocket.OPEN) {
                    try {
                      c.send(payload2);
                    } catch {}
                  }
                }
              }
            }
            const last = all[all.length - 1];
            if (last?.t) lastCandleTs.set(ticker, last.t);
          }
        } catch (e: unknown) {
          const clients = tickerSubs.get(ticker);
          const payload = JSON.stringify({ type: 'error', ticker, message: errorMessage(e, 'failed to fetch candles') });
          if (clients) {
            for (const c of clients) {
              if (c.readyState === WebSocket.OPEN) {
                try {
                  c.send(payload);
                } catch {}
              }
            }
          }
        } finally {
          lastCandlesPollAt.set(ticker, now);
        }
      }

      // 3) Trades update (rate-limited)
      const nowTrades = Date.now();
      const lastTradesAt = lastTradesPollAt.get(ticker) || 0;
      if (nowTrades - lastTradesAt >= TRADES_POLL_MS) {
        try {
          const trades = await getRecentTradesByTicker(ticker);
          const payload3 = JSON.stringify({ type: 'trades', ticker, trades, ts: new Date().toISOString() });
          const clients = tickerSubs.get(ticker);
          if (clients) {
            for (const c of clients) {
              if (c.readyState === WebSocket.OPEN) {
                try {
                  c.send(payload3);
                } catch {}
              }
            }
          }
        } catch (e: unknown) {
          const clients = tickerSubs.get(ticker);
          const payload = JSON.stringify({ type: 'error', ticker, message: errorMessage(e, 'failed to fetch trades') });
          if (clients) {
            for (const c of clients) {
              if (c.readyState === WebSocket.OPEN) {
                try {
                  c.send(payload);
                } catch {}
              }
            }
          }
        } finally {
          lastTradesPollAt.set(ticker, nowTrades);
        }
      }
    }, INTERVAL_MS);
    pollers.set(ticker, h);
  }

  wss.on('connection', (ws: HeartbeatWS) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (raw: RawData) => {
      try {
        const msg: WSMessage = JSON.parse(String(raw));
        if (msg?.type === 'subscribe' && typeof msg.ticker === 'string') {
          subscribeClientTo(ws, msg.ticker);
          ws.send(
            JSON.stringify({ type: 'subscribed', ticker: String(msg.ticker).toUpperCase() }),
          );
        } else if (msg?.type === 'unsubscribe' && typeof msg.ticker === 'string') {
          unsubscribeClientFrom(ws, msg.ticker);
          ws.send(
            JSON.stringify({ type: 'unsubscribed', ticker: String(msg.ticker).toUpperCase() }),
          );
        } else if (msg?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: new Date().toISOString() }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'unknown message' }));
        }
      } catch (e: unknown) {
        ws.send(
          JSON.stringify({ type: 'error', message: errorMessage(e, 'bad message') }),
        );
      }
    });

    ws.on('close', () => {
      cleanupClient(ws);
    });

    ws.on('error', () => {
      cleanupClient(ws);
    });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients as Set<HeartbeatWS>) {
      const alive = ws.isAlive;
      if (alive === false) {
        try {
          ws.terminate();
        } catch {}
        continue;
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch {}
    }
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));
}
