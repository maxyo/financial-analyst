// @ts-nocheck
import express = require('express');
import cors = require('cors')
import type { Request, Response } from 'express';
import * as path from 'path';
import * as http from 'http';
import { WebSocketServer } from 'ws';
import { WebSocket, RawData } from 'ws';
import { config as configDotenv } from 'dotenv';
import { getSummaryByTicker, getTodayCandlesByTicker, findInstrument, getUnderlyingSummaryByTicker, getOpenPositions, getRecentTradesByTicker } from './api';

configDotenv();

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
    const query = String((req.query as any).query || '').trim();
    if (!query) return res.status(400).json({ error: 'query required' });
    const inst = await findInstrument(query);
    if (!inst) return res.json({ instruments: [] });
    res.json({ instruments: [inst] });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'internal error' });
  }
});

// Summary endpoint
app.get('/api/summary', async (req: Request, res: Response) => {
  try {
    const q = req.query as any;
    const ticker = String(q.ticker || '').trim();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });

    // Optional MoEx funding parameters
    const opt: any = {};
    const n = (x: any) => { const v = Number(x); return Number.isFinite(v) ? v : undefined; };
    if (q.k1 != null) opt.k1 = n(q.k1);
    if (q.k2 != null) opt.k2 = n(q.k2);
    if (q.prevBasePrice != null) opt.prevBasePrice = n(q.prevBasePrice);
    if (q.d != null) opt.d = n(q.d);
    if (q.cbr != null) opt.cbr = n(q.cbr);
    if (q.underlyingPrice != null) opt.underlyingPrice = n(q.underlyingPrice);
    if (q.windowStart != null) opt.windowStart = String(q.windowStart);
    if (q.windowEnd != null) opt.windowEnd = String(q.windowEnd);
    if (q.mode != null) {
      const m = String(q.mode);
      if (m === 'generic' || m === 'currency' || m === 'manual') opt.mode = m;
    }

    const data = await getSummaryByTicker(ticker, opt);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'internal error' });
  }
});

// Underlying summary endpoint
app.get('/api/underlying-summary', async (req: Request, res: Response) => {
  try {
    const ticker = String((req.query as any).ticker || '').trim();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    const data = await getUnderlyingSummaryByTicker(ticker);
    res.json(data);
  } catch (e: any) {
    const msg = e?.message || 'failed to resolve underlying';
    // If can't resolve underlying, return 404 so frontend can hide the panel
    res.status(404).json({ error: msg });
  }
});

// Candles endpoint
app.get('/api/candles', async (req: Request, res: Response) => {
  try {
    const ticker = String((req.query as any).ticker || '').trim();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    const data = await getTodayCandlesByTicker(ticker);
    res.json({ points: data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'internal error' });
  }
});

// Open positions endpoint
app.get('/api/positions', async (req: Request, res: Response) => {
  try {
    const accountId = String((req.query as any).accountId || '').trim() || undefined;
    const positions = await getOpenPositions(accountId);
    res.json({ positions });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'internal error' });
  }
});

// Trades endpoint (recent anonymized trades ~ last hour)
app.get('/api/trades', async (req: Request, res: Response) => {
  try {
    const ticker = String((req.query as any).ticker || '').trim();
    if (!ticker) return res.status(400).json({ error: 'ticker required' });
    const trades = await getRecentTradesByTicker(ticker);
    res.json({ trades });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'internal error' });
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
    const payload = JSON.stringify({ type: 'candles', ticker, mode: 'snapshot', points, ts: new Date().toISOString() });
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(payload); } catch {}
    }
  } catch (e: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'error', ticker, message: e?.message || 'failed to fetch candles' })); } catch {}
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
  try { sendCandlesSnapshot(ws, t); } catch {}
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
    } catch (e: any) {
      const clients = tickerSubs.get(ticker);
      const payload = JSON.stringify({ type: 'error', ticker, message: e?.message || 'failed to fetch quote' });
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
          let toSend = [] as any[];
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
      } catch (e: any) {
        const clients = tickerSubs.get(ticker);
        const payload = JSON.stringify({ type: 'error', ticker, message: e?.message || 'failed to fetch candles' });
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

wss.on('connection', (ws: WebSocket) => {
  (ws as any).isAlive = true;
  ws.on('pong', () => { (ws as any).isAlive = true; });

  ws.on('message', (raw: RawData) => {
    try {
      const msg = JSON.parse(String(raw));
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
    } catch (e: any) {
      ws.send(JSON.stringify({ type: 'error', message: e?.message || 'bad message' }));
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
  for (const ws of wss.clients) {
    const alive = (ws as any).isAlive;
    if (alive === false) { try { ws.terminate(); } catch {} continue; }
    (ws as any).isAlive = false;
    try { ws.ping(); } catch {}
  }
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
