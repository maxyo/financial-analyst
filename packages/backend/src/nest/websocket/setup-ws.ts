import * as http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type { RawData } from 'ws';

import { computeMoexClearingInstants } from '../../lib/calculations';
import { errorMessage } from '../../lib/utils/http';

interface ClearingPoint {
  t: string;
  fundingRateEst?: number | null;
}
interface HeartbeatWS extends WebSocket {
  isAlive?: boolean;
}

export type WSMessageType = 'subscribe' | 'unsubscribe' | 'ping';
export interface WSMessage {
  type: WSMessageType;
  ticker?: string;
}

// Minimal events interface to decouple from legacy JobsProcessor types
type JobsEvents = {
  on(event: 'job:succeeded', listener: (payload: { job?: any; result?: any }) => void): any;
};

export type WSServices = {
  candles: { getTodayCandlesByTicker(ticker: string): Promise<any[]> };
  summary: {
    getSummaryByTicker(ticker: string): Promise<any>;
    getUnderlyingSummaryByTicker(ticker: string): Promise<any>;
  };
  trades: { getPublicTrades(ticker: string, sinceMs?: number): Promise<any[]> };
};

export function setupWebSocket(server: http.Server, jobsEvents?: JobsEvents, services?: WSServices) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const tickerSubs = new Map<string, Set<WebSocket>>();
  const clientSubs = new WeakMap<WebSocket, Set<string>>();
  const pollers = new Map<string, NodeJS.Timeout>();
  const INTERVAL_MS = Number(process.env.QUOTE_POLL_MS || 2000);

  const lastCandleTs = new Map<string, string>();

  const TRADES_POLL_MS = Number(process.env.TRADES_POLL_MS || 10000);
  const lastTradesPollAt = new Map<string, number>();

  // Event-driven candles broadcasting when import job succeeds
  if (jobsEvents) {
    jobsEvents.on('job:succeeded', async ({ job, result }) => {
      try {
        if (!job || job.type !== 'candles.import.tinkoff') return;
        const tickerRaw = (result && (result as any).ticker) || (job.payload && (job.payload.ticker || job.payload.symbol));
        if (!tickerRaw || typeof tickerRaw !== 'string') return;
        const ticker = tickerRaw.trim().toUpperCase();
        const clients = tickerSubs.get(ticker);
        if (!clients || clients.size === 0) return; // no subscribers for this ticker
        const all = await services!.candles.getTodayCandlesByTicker(ticker);
        if (Array.isArray(all) && all.length) {
          const lastSentIso = lastCandleTs.get(ticker);
          let toSend: any[] = [];
          if (!lastSentIso) {
            // If we never sent any candles for this ticker in this WS lifetime, send only the latest point
            toSend = [all[all.length - 1]];
          } else {
            const lastMs = Date.parse(lastSentIso);
            toSend = all.filter((c: any) => {
              const ms = Date.parse(c.t);
              return Number.isFinite(ms) && ms >= lastMs;
            });
          }
          if (toSend.length) {
            const payload = JSON.stringify({
              type: 'candles',
              ticker,
              mode: 'update',
              points: toSend,
              ts: new Date().toISOString(),
            });
            for (const c of clients) {
              if (c.readyState === WebSocket.OPEN) {
                try {
                  c.send(payload);
                } catch {}
              }
            }
          }
          const last = all[all.length - 1];
          if (last?.t) lastCandleTs.set(ticker, last.t);
        }
      } catch (e: unknown) {
        const tickerRaw = job?.payload && (job.payload.ticker || job.payload.symbol);
        const ticker = typeof tickerRaw === 'string' ? tickerRaw.trim().toUpperCase() : undefined;
        if (!ticker) return;
        const clients = tickerSubs.get(ticker);
        const payload = JSON.stringify({
          type: 'error',
          ticker,
          message: errorMessage(e, 'failed to fetch/broadcast candles after job'),
        });
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
    });
  }

  async function sendCandlesSnapshot(ws: WebSocket, ticker: string) {
    try {
      const points = await services!.candles.getTodayCandlesByTicker(ticker);
      const last = Array.isArray(points) && points.length ? points[points.length - 1] : null;
      if (last?.t) lastCandleTs.set(ticker, last.t);
      let clearings: ClearingPoint[] = [];
      try {
        const instants = computeMoexClearingInstants();
        const s = await services!.summary.getSummaryByTicker(ticker);
        const envK2 = process.env.FUNDING_K2;
        const k2 = envK2 != null ? Number(envK2) : undefined;
        let basePrice: number | undefined;
        if (s.fundingL2 != null && k2) {
          basePrice = Number(s.fundingL2) / Number(k2);
        }
        if (basePrice == null || !Number.isFinite(basePrice) || basePrice <= 0) {
          basePrice = s.vwap != null ? Number(s.vwap) : s.lastPrice != null ? Number(s.lastPrice) : undefined;
        }
        const fundingFraction =
          s.fundingPerUnit != null && basePrice != null && Number(basePrice) > 0
            ? Number(s.fundingPerUnit) / Number(basePrice)
            : s.fundingRateEst;
        clearings = instants.map((t) => ({
          t,
          fundingRateEst: fundingFraction ?? null,
        }));
      } catch {
        // ignore
      }
      const payload = JSON.stringify({
        type: 'candles',
        ticker,
        mode: 'snapshot',
        points,
        clearings,
        ts: new Date().toISOString(),
      });
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch {}
      }
    } catch (e: unknown) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(
            JSON.stringify({
              type: 'error',
              ticker,
              message: errorMessage(e, 'failed to fetch candles'),
            }),
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
        const data = await services!.summary.getSummaryByTicker(ticker);
        let underlying: any = undefined;
        try {
          underlying = await services!.summary.getUnderlyingSummaryByTicker(ticker);
        } catch (_) {
          underlying = undefined;
        }
        const payload = JSON.stringify({
          type: 'quote',
          ticker,
          summary: data,
          underlying,
          ts: new Date().toISOString(),
        });
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
        const payload = JSON.stringify({
          type: 'error',
          ticker,
          message: errorMessage(e, 'failed to fetch quote'),
        });
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

      // 3) Trades update (rate-limited)
      const nowTrades = Date.now();
      const lastTradesAt = lastTradesPollAt.get(ticker) || 0;
      if (nowTrades - lastTradesAt >= TRADES_POLL_MS) {
        try {
          const trades = await services!.trades.getPublicTrades(ticker);
          const payload3 = JSON.stringify({
            type: 'trades',
            ticker,
            trades,
            ts: new Date().toISOString(),
          });
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
          const payload = JSON.stringify({
            type: 'error',
            ticker,
            message: errorMessage(e, 'failed to fetch trades'),
          });
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
            JSON.stringify({
              type: 'subscribed',
              ticker: String(msg.ticker).toUpperCase(),
            }),
          );
        } else if (msg?.type === 'unsubscribe' && typeof msg.ticker === 'string') {
          unsubscribeClientFrom(ws, msg.ticker);
          ws.send(
            JSON.stringify({
              type: 'unsubscribed',
              ticker: String(msg.ticker).toUpperCase(),
            }),
          );
        } else if (msg?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: new Date().toISOString() }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'unknown message' }));
        }
      } catch (e: unknown) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: errorMessage(e, 'bad message'),
          }),
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
