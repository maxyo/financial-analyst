import * as http from 'http';
import * as path from 'path';

import cors = require('cors');
import { config as configDotenv } from 'dotenv';
import express = require('express');
import { WebSocketServer, WebSocket } from 'ws';

import { getSummaryByTicker, getTodayCandlesByTicker, findInstrument, getUnderlyingSummaryByTicker, getOpenPositions, getRecentTradesByTicker, getUserTradesByTicker } from './api';
import {
  computeMoexClearingInstants,
  fundingRateEstAt,
} from './lib/calculations';

import type { CandlePoint, FundingOptions } from './api/types';
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

    // Optional MoEx funding parameters
    const opt: FundingOptions = {};
    const q = (k: string) => getQ(req, k);
    const n = (k: string) => getN(q(k));
    const m = q('mode');
    opt.k1 = n('k1');
    opt.k2 = n('k2');
    opt.prevBasePrice = n('prevBasePrice');
    opt.d = n('d');
    opt.cbr = n('cbr');
    opt.underlyingPrice = n('underlyingPrice');
    const ws = q('windowStart'); if (ws) opt.windowStart = ws;
    const we = q('windowEnd'); if (we) opt.windowEnd = we;
    if (m === 'generic' || m === 'currency' || m === 'manual') opt.mode = m;

    const data = await getSummaryByTicker(ticker, opt);
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
    const points = await getTodayCandlesByTicker(ticker);
    // Compute clearing markers and funding at clearing based on intraday candles
    let clearings: ClearingPoint[] = [];
    try {
      const instants = computeMoexClearingInstants();
      clearings = instants.map((t) => ({ t, fundingRateEst: fundingRateEstAt(points, t) }));
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

async function sendCandlesSnapshot(ws: WebSocket, ticker: string) {
  try {
    const points = await getTodayCandlesByTicker(ticker);
    // update last sent marker
    const last = Array.isArray(points) && points.length ? points[points.length - 1] : null;
    if (last?.t) lastCandleTs.set(ticker, last.t);
    // compute clearings similar to REST endpoint
    let clearings: ClearingPoint[] = [];
    try {
      const { computeMoexClearingInstants, fundingRateEstAt } = await import('./lib/calculations');
      const instants = computeMoexClearingInstants();
      clearings = instants.map((t) => ({ t, fundingRateEst: fundingRateEstAt(points, t) }));
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
      const payload = JSON.stringify({ type: 'quote', ticker, summary: data, ts: new Date().toISOString() });
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
