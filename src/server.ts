import * as http from 'http';
import * as path from 'path';

import cors = require('cors');
import { config as configDotenv } from 'dotenv';
import express = require('express');
import { WebSocketServer, WebSocket } from 'ws';

import { getSummaryByTicker, getTodayCandlesByTicker, findInstrument, getUnderlyingSummaryByTicker, getOpenPositions, getRecentTradesByTicker, getUserTradesByTicker } from './api';
import {
  computeMoexClearingInstants,
} from './lib/calculations';

import type { CandlePoint } from './api/types';
import type { Request, Response } from 'express';
import type { RawData } from 'ws';

configDotenv();

// Local helpers and types to avoid using 'any'
interface ClearingPoint { t: string; fundingRateEst?: number }
interface HeartbeatWS extends WebSocket { isAlive?: boolean }

type WSMessageType = 'subscribe' | 'unsubscribe' | 'ping';
interface WSMessage { type: WSMessageType; ticker?: string }

const getQ = (req: Request, key: string): string | undefined => {
  const v = (req.query as Record<string, unknown>)[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : String(v[0]);
  return v != null ? String(v) : undefined;
};

const getN = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const errorMessage = (e: unknown, fallback = 'internal error'): string => {
  if (e instanceof Error) return e.message;
  return typeof e === 'string' ? e : fallback;
};

const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());
app.use(cors())

// Static frontend
app.use(express.static(path.join(rootDir, 'public')));

// Health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Search instruments by query
app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const query = (getQ(req, 'query') || '').trim();
    if (!query) return res.status(400).json({ error: 'query required' });
    const inst = await findInstrument(query);
    if (!inst) return res.json({ instruments: [] });
    res.json({ instruments: [inst] });
  } catch (e: unknown) {
    res.status(500).json({ error: errorMessage(e) });
  }
});

// Summary endpoint
app.get('/api/summary', async (req: Request, res: Response) => {
  try {
    const ticker = (getQ(req, 'ticker') || '').trim();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });

    const q = (k: string) => getQ(req, k);
    const ws = q('windowStart');
    const we = q('windowEnd');

    const data = await getSummaryByTicker(ticker, ws, we);
    res.json(data);
  } catch (e: unknown) {
    res.status(500).json({ error: errorMessage(e) });
  }
});

// Underlying summary endpoint
app.get('/api/underlying-summary', async (req: Request, res: Response) => {
  try {
    const ticker = (getQ(req, 'ticker') || '').trim();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    const data = await getUnderlyingSummaryByTicker(ticker);
    res.json(data);
  } catch (e: unknown) {
    const msg = errorMessage(e, 'failed to resolve underlying');
    // If can't resolve underlying, return 404 so frontend can hide the panel
    res.status(404).json({ error: msg });
  }
});

// Candles endpoint
app.get('/api/candles', async (req: Request, res: Response) => {
  try {
    const ticker = (getQ(req, 'ticker') || '').trim();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    const interval = (getQ(req, 'interval') || '').trim() || undefined;
    const points = await getTodayCandlesByTicker(ticker, interval);
    // Compute clearing markers and funding at clearing based on computeAccurateFunding
    let clearings: ClearingPoint[] = [];
    try {
      const instants = computeMoexClearingInstants();
      // Derive funding fraction from current summary via computeAccurateFunding
      const s = await getSummaryByTicker(ticker);
      const envK2 = process.env.FUNDING_K2;
      const k2 = envK2 != null ? Number(envK2) : undefined;
      let basePrice: number | undefined;
      if (s.fundingL2 != null && k2) basePrice = Number(s.fundingL2) / Number(k2);
      if (basePrice == null || !Number.isFinite(basePrice) || basePrice <= 0) {
        basePrice = s.vwap != null ? Number(s.vwap) : s.lastPrice != null ? Number(s.lastPrice) : undefined;
      }
      const fundingFraction = s.fundingPerUnit != null && basePrice != null && Number(basePrice) > 0
        ? Number(s.fundingPerUnit) / Number(basePrice)
        : s.fundingRateEst;
      clearings = instants.map((t) => ({ t, fundingRateEst: fundingFraction }));
    } catch {
      // ignore
    }
    res.json({ points, clearings });
  } catch (e: unknown) {
    res.status(500).json({ error: errorMessage(e) });
  }
});

// Open positions endpoint
app.get('/api/positions', async (req: Request, res: Response) => {
  try {
    const accountId = (getQ(req, 'accountId') || '').trim() || undefined;
    const ticker = (getQ(req, 'ticker') || '').trim();
    if(!ticker) {
      throw new Error('ticker required');
    }
    const positions = await getOpenPositions(ticker, accountId);
    res.json({ positions });
  } catch (e: unknown) {
    res.status(500).json({ error: errorMessage(e) });
  }
});

// Trades endpoint: return user's own trades by default (last 24h); fallback to public if requested
app.get('/api/trades', async (req: Request, res: Response) => {
  try {
    const ticker = (getQ(req, 'ticker') || '').trim();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    const accountId = (getQ(req, 'accountId') || '').trim() || undefined;
    const hoursN = getN(getQ(req, 'hours'));
    const lookback = hoursN && hoursN > 0 ? hoursN : 24;

    // If explicit mode=public passed, return anonymized market trades for backward-compat
    const mode = (getQ(req, 'mode') || '').toLowerCase();
    if (mode === 'public') {
      const trades = await getRecentTradesByTicker(ticker);
      return res.json({ trades });
    }

    // Default: user's own executed trades for the account (or default account)
    const trades = await getUserTradesByTicker(ticker, accountId, lookback);
    res.json({ trades });
  } catch (e: unknown) {
    // Best-effort fallback to public anonymized if user operations are unavailable
    try {
      const ticker = (getQ(req, 'ticker') || '').trim();
      const trades = await getRecentTradesByTicker(ticker);
      return res.json({ trades, fallback: true });
    } catch (e2: unknown) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
});

// ---- WebSocket server for real-time quotes ----
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Subscriptions: ticker -> clients, and reverse mapping client -> tickers
const tickerSubs = new Map<string, Set<WebSocket>>();
const clientSubs = new WeakMap<WebSocket, Set<string>>();
const pollers = new Map<string, NodeJS.Timeout>();
const INTERVAL_MS = Number(process.env.QUOTE_POLL_MS || 2000);

// Candles polling control
const CANDLES_POLL_MS = Number(process.env.CANDLES_POLL_MS || 5000);
const lastCandleTs = new Map<string, string>(); // ticker -> last sent candle ISO time
const lastCandlesPollAt = new Map<string, number>(); // ticker -> last poll timestamp
// Trades polling control
const TRADES_POLL_MS = Number(process.env.TRADES_POLL_MS || 10000);
const lastTradesPollAt = new Map<string, number>(); // ticker -> last poll timestamp

async function sendCandlesSnapshot(ws: WebSocket, ticker: string) {
  try {
    const points = await getTodayCandlesByTicker(ticker);
    // update last sent marker
    const last = Array.isArray(points) && points.length ? points[points.length - 1] : null;
    if (last?.t) lastCandleTs.set(ticker, last.t);
    // compute clearings similar to REST endpoint using computeAccurateFunding result
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
      const fundingFraction = s.fundingPerUnit != null && basePrice != null && Number(basePrice) > 0
        ? Number(s.fundingPerUnit) / Number(basePrice)
        : s.fundingRateEst;
      clearings = instants.map((t) => ({ t, fundingRateEst: fundingFraction }));
    } catch {
      // ignore
    }
    const payload = JSON.stringify({ type: 'candles', ticker, mode: 'snapshot', points, clearings, ts: new Date().toISOString() });
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(payload); } catch {}
    }
  } catch (e: unknown) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'error', ticker, message: errorMessage(e, 'failed to fetch candles') })); } catch {}
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
  // Send initial candles snapshot to the newly subscribed client
  try { void sendCandlesSnapshot(ws, t); } catch {}
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
      // Try to enrich with underlying summary (if applicable)
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
            try { c.send(payload); } catch {}
          }
        }
      }
    } catch (e: unknown) {
      const clients = tickerSubs.get(ticker);
      const payload = JSON.stringify({ type: 'error', ticker, message: errorMessage(e, 'failed to fetch quote') });
      if (clients) {
        for (const c of clients) {
          if (c.readyState === WebSocket.OPEN) {
            try { c.send(payload); } catch {}
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
            // if no marker yet (e.g., server just started), send only the latest candle as an update
            toSend = [all[all.length - 1]];
          } else {
            const lastMs = Date.parse(lastSentIso);
            toSend = all.filter(c => {
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
                  try { c.send(payload2); } catch {}
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
              try { c.send(payload); } catch {}
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
              try { c.send(payload3); } catch {}
            }
          }
        }
      } catch (e: unknown) {
        const clients = tickerSubs.get(ticker);
        const payload = JSON.stringify({ type: 'error', ticker, message: errorMessage(e, 'failed to fetch trades') });
        if (clients) {
          for (const c of clients) {
            if (c.readyState === WebSocket.OPEN) {
              try { c.send(payload); } catch {}
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
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw: RawData) => {
    try {
      const msg: WSMessage = JSON.parse(String(raw));
      if (msg?.type === 'subscribe' && typeof msg.ticker === 'string') {
        subscribeClientTo(ws, msg.ticker);
        ws.send(JSON.stringify({ type: 'subscribed', ticker: String(msg.ticker).toUpperCase() }));
      } else if (msg?.type === 'unsubscribe' && typeof msg.ticker === 'string') {
        unsubscribeClientFrom(ws, msg.ticker);
        ws.send(JSON.stringify({ type: 'unsubscribed', ticker: String(msg.ticker).toUpperCase() }));
      } else if (msg?.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: new Date().toISOString() }));
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'unknown message' }));
      }
    } catch (e: unknown) {
      ws.send(JSON.stringify({ type: 'error', message: errorMessage(e, 'bad message') }));
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
    if (alive === false) { try { ws.terminate(); } catch {} continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  }
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
