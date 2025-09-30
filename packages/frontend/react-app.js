const { useState, useEffect, useMemo, useRef } = React;

// Config
const API_URL = 'http://localhost:3000';

// Helpers
function fmt(n, digits = 4) {
  if (n == null || Number.isNaN(n)) return '-';
  try {
    const f = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: true,
    });
    return f.format(Number(n));
  } catch {
    return Number(n).toFixed(digits);
  }
}
function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return '-';
  try {
    const f = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    });
    return f.format(Number(n));
  } catch {
    return String(Math.trunc(Number(n)));
  }
}
function fmtPct(v, digits = 4) {
  if (v == null || !isFinite(Number(v))) return '-';
  return `${fmt(Number(v) * 100, digits)}%`;
}
function signClass(v) {
  if (v == null || !isFinite(Number(v))) return '';
  return Number(v) > 0 ? 'pos' : Number(v) < 0 ? 'neg' : '';
}

function scaleToMs(scale) {
  switch (scale) {
    case '1m':
      return 60 * 1000;
    case '5m':
      return 5 * 60 * 1000;
    case '15m':
      return 15 * 60 * 1000;
    case '1h':
      return 60 * 60 * 1000;
    default:
      return 60 * 1000;
  }
}
function aggregateCandles(candles, scale) {
  if (!Array.isArray(candles) || candles.length === 0) return [];
  if (scale === '1m') return candles.slice();
  const step = scaleToMs(scale);
  const map = new Map();
  for (const p of candles) {
    if (!p || !p.t) continue;
    const ts = new Date(p.t).getTime();
    if (!isFinite(ts)) continue;
    const bucket = Math.floor(ts / step) * step;
    let agg = map.get(bucket);
    if (!agg) {
      agg = {
        t: new Date(bucket).toISOString(),
        o: p.o,
        h: p.h,
        l: p.l,
        c: p.c,
        v: p.v ?? 0,
        _firstTs: ts,
        _lastTs: ts,
      };
      map.set(bucket, agg);
    } else {
      if (ts < agg._firstTs) {
        agg._firstTs = ts;
        agg.o = p.o;
      }
      if (ts > agg._lastTs) {
        agg._lastTs = ts;
        agg.c = p.c;
      }
      if (p.h != null) agg.h = Math.max(agg.h ?? p.h, p.h);
      if (p.l != null) agg.l = Math.min(agg.l ?? p.l, p.l);
      agg.v = (agg.v || 0) + (p.v || 0);
    }
  }
  const result = Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, a]) => {
      const clean = { ...a };
      delete clean._firstTs;
      delete clean._lastTs;
      return clean;
    });
  return result;
}

async function fetchJSON(url) {
  const res = await fetch(`${API_URL}${url}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

function useWebSocket(ticker, onMessage) {
  const wsRef = useRef(null);
  const tickerRef = useRef(ticker);
  tickerRef.current = ticker;

  useEffect(() => {
    let closed = false;
    function wsUrl() {
      const loc = window.location;
      const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${loc.host}/ws`;
    }
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (tickerRef.current) {
        ws.send(JSON.stringify({ type: 'subscribe', ticker: tickerRef.current }));
      }
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        onMessage && onMessage(msg);
      } catch {}
    };
    ws.onclose = () => {
      wsRef.current = null;
      if (!closed) {
        // try to reconnect after short delay
        setTimeout(() => {
          if (!closed) {
            // trigger re-init by changing key through state caller
            // handled via effect deps on ticker
          }
        }, 1500);
      }
    };

    const pingTimer = setInterval(() => {
      try {
        ws.send(JSON.stringify({ type: 'ping' }));
      } catch {}
    }, 30000);

    return () => {
      closed = true;
      clearInterval(pingTimer);
      try {
        if (wsRef.current) {
          if (tickerRef.current) {
            wsRef.current.send(
              JSON.stringify({ type: 'unsubscribe', ticker: tickerRef.current }),
            );
          }
          wsRef.current.close();
        }
      } catch {}
      wsRef.current = null;
    };
  }, [ticker, onMessage]);

  return wsRef;
}

function AnyChartStock({ candles, trades, clearings }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!window.anychart) return;

    anychart.format.locales.default = anychart.format.locales['ru-ru'];
    const table = anychart.data.table('t');
    const mapping = table.mapAs({ open: 'o', high: 'h', low: 'l', close: 'c', value: 'v' });

    const chart = anychart.stock();
    chart.background().fill('#0b1222');
    chart.container(containerRef.current);
    const plot = chart.plot(0);
    plot.yGrid(true);
    const series = plot.candlestick(mapping);
    series.name('Цена');

    // Event markers: group0 clearings, group1 buys, group2 sells
    plot.eventMarkers().group(0).format('C');
    plot.eventMarkers().group(1).format('B');
    plot.eventMarkers().group(2).format('S');

    chart.draw();
    chartRef.current = { chart, table, plot };

    return () => {
      try { chart.dispose(); } catch {}
      chartRef.current = null;
    };
  }, []);

  // Update data
  useEffect(() => {
    const inst = chartRef.current;
    if (!inst) return;
    const { table, plot } = inst;
    const pts = Array.isArray(candles) ? candles : [];
    try { table.remove(); } catch {}
    try { table.addData(pts); } catch {}

    // Trades to markers
    const tradeItems = (Array.isArray(trades) ? trades : []).map((t) => {
      if (!t || !t.t || t.p == null) return null;
      const ms = new Date(t.t).getTime();
      if (!isFinite(ms)) return null;
      const price = Number(t.p);
      const qty = t.q != null ? Number(t.q) : null;
      const side = (t.side || '').toLowerCase();
      const isBuy = side === 'buy';
      const isSell = side === 'sell';
      const color = isBuy ? '#22c55e' : isSell ? '#ef4444' : '#94a3b8';
      const type = isBuy ? 'triangle-up' : isSell ? 'triangle-down' : 'circle';
      return {
        x: ms,
        date: ms,
        value: price,
        type,
        direction: isBuy ? 'up' : isSell ? 'down' : 'auto',
        description: `Сделка ${isBuy ? 'BUY' : isSell ? 'SELL' : ''}\nЦена: ${fmt(price)}${qty != null ? `\nОбъём: ${fmtInt(qty)}` : ''}`,
        normal: { fill: color, stroke: { color, thickness: 1 } },
        hovered: { fill: color, stroke: { color, thickness: 2 } },
        selected: { fill: color, stroke: { color, thickness: 2 } },
      };
    }).filter(Boolean);

    // Clearings
    const clearingItems = (Array.isArray(clearings) ? clearings : []).map((c) => {
      if (!c || !c.t) return null;
      const ms = new Date(c.t).getTime();
      if (!isFinite(ms)) return null;
      return {
        x: ms,
        date: c.t,
        type: 'pin',
        direction: 'up',
        description: `Клиринг\nФандинг ~ ${fmtPct(c.fundingRateEst, 3)}`,
        normal: { fill: '#eab308', stroke: { color: '#eab308', thickness: 1 } },
        hovered: { fill: '#f59e0b', stroke: { color: '#f59e0b', thickness: 1 } },
        selected: { fill: '#fbbf24', stroke: { color: '#fbbf24', thickness: 1 } },
      };
    }).filter(Boolean);

    try {
      plot.eventMarkers().group(0).data(clearingItems);
      plot.eventMarkers().group(1).data(tradeItems.filter((x) => x.type === 'triangle-up'));
      plot.eventMarkers().group(2).data(tradeItems.filter((x) => x.type === 'triangle-down'));
    } catch {}
  }, [candles, trades, clearings]);

  return React.createElement('div', { id: 'chart', ref: containerRef, style: { width: '100%', height: 420 } });
}

function App() {
  const [ticker, setTicker] = useState('CNYRUBF');
  const [status, setStatus] = useState('');
  const [scale, setScale] = useState('1m');
  const [summary, setSummary] = useState(null);
  const [underlying, setUnderlying] = useState(null);
  const [positions, setPositions] = useState([]);
  const [candles, setCandles] = useState([]);
  const [trades, setTrades] = useState([]);
  const [clearings, setClearings] = useState([]);

  const aggCandles = useMemo(() => aggregateCandles(candles, scale), [candles, scale]);

  // WS to update candles and live quotes
  useWebSocket(ticker, (msg) => {
    if (!msg || typeof msg !== 'object') return;
    // {type: 'pong'} ignored
    if (msg.type === 'candles_snapshot') {
      const pts = Array.isArray(msg.points) ? msg.points : [];
      setCandles(pts);
    } else if (msg.type === 'candles_update') {
      const pts = Array.isArray(msg.points) ? msg.points : [];
      setCandles((prev) => {
        const map = new Map((prev || []).map((p) => [p.t, p]));
        for (const p of pts) if (p && p.t) map.set(p.t, p);
        return Array.from(map.values()).sort((a, b) => new Date(a.t) - new Date(b.t));
      });
    } else if (msg.type === 'summary') {
      // optional: server may push summary/live price
      if (msg.summary) setSummary(msg.summary);
    }
  });

  async function loadAll(targetTicker) {
    const t = (targetTicker || ticker || '').trim();
    if (!t) return;
    setStatus('Загрузка...');
    try {
      const [sum, candlesResp, tradesResp, posResp] = await Promise.all([
        fetchJSON(`/api/summary?ticker=${encodeURIComponent(t)}`),
        fetchJSON(`/api/candles?ticker=${encodeURIComponent(t)}`),
        fetchJSON(`/api/trades?ticker=${encodeURIComponent(t)}`),
        fetchJSON(`/api/positions?ticker=${encodeURIComponent(t)}`),
      ]);
      setSummary(sum || null);
      if (sum && sum.underlying) setUnderlying(sum.underlying); else setUnderlying(null);
      setClearings((sum && sum.clearings) || []);
      setCandles((candlesResp && candlesResp.points) || []);
      setTrades((tradesResp && tradesResp.trades) || []);
      setPositions((posResp && posResp.positions) || []);
      setStatus('');
    } catch (e) {
      console.error(e);
      setStatus('Ошибка загрузки данных');
    }
  }

  // Initial load
  useEffect(() => {
    loadAll(ticker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <header>
        <h2>Панель инструментов</h2>
        <div className="panel">
          <label htmlFor="ticker">Тикер:</label>
          <input id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="например, CNYRUBF" />
          <button id="load" onClick={() => loadAll(ticker)}>Загрузить</button>
          <span id="status" className="muted">{status}</span>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h3 id="title">Инструмент</h3>
          <div id="summary">
            {summary ? (
              <table className="kv"><tbody>
                <tr><td>Тикер</td><td className="num"><span className="badge">{summary.ticker || '-'}</span></td></tr>
                <tr><td>Название</td><td className="num">{summary.name || '-'}</td></tr>
                <tr><td>Last</td><td className={`num ${signClass(summary.lastPrice)}`}>{fmt(summary.lastPrice, 6)}</td></tr>
                <tr><td>Bid</td><td className="num">{fmt(summary.bestBid, 6)}</td></tr>
                <tr><td>Ask</td><td className="num">{fmt(summary.bestAsk, 6)}</td></tr>
                <tr><td>Спред</td><td className="num">{fmt(summary.spread, 6)}</td></tr>
                <tr><td>VWAP (сегодня)</td><td className="num">{fmt(summary.vwap, 6)}</td></tr>
                <tr><td>Премия</td><td className={`num ${signClass(summary.premium)}`}>{fmtPct(summary.premium, 4)}</td></tr>
                <tr><td>Оценка фандинга</td><td className={`num ${signClass(summary.fundingRateEst)}`}>{fmtPct(summary.fundingRateEst, 4)}</td></tr>
                {summary.fundingPerUnit != null && (
                  <tr><td>Фандинг/ед.</td><td className={`num ${signClass(summary.fundingPerUnit)}`}>{fmt(summary.fundingPerUnit, 6)}</td></tr>
                )}
              </tbody></table>
            ) : (
              <div className="muted">Нет данных</div>
            )}
          </div>
        </div>

        <div id="underlyingCard" className="card" style={{ display: underlying ? 'block' : 'none', height: 'auto' }}>
          <h3 id="underlyingTitle">Базовый актив</h3>
          <div id="underlyingSummary">
            {underlying ? (
              <table className="kv"><tbody>
                <tr><td>Тикер</td><td className="num"><span className="badge">{underlying.ticker || '-'}</span></td></tr>
                <tr><td>Название</td><td className="num">{underlying.name || '-'}</td></tr>
                <tr><td>Last</td><td className={`num ${signClass(underlying.lastPrice)}`}>{fmt(underlying.lastPrice, 6)}</td></tr>
                <tr><td>VWAP (сегодня)</td><td className="num">{fmt(underlying.vwap, 6)}</td></tr>
              </tbody></table>
            ) : (
              <div className="muted">Нет данных</div>
            )}
          </div>
        </div>

        <div className="card">
          <div id="positions">
            {(!positions || positions.length === 0) ? (
              <div className="muted">Нет открытых позиций</div>
            ) : (
              <div className="grid">
                {positions.map((p, i) => {
                  const t = p.ticker || p.figi || p.instrumentId || '-';
                  const name = p.name || '-';
                  const qty = p.quantity != null ? fmtInt(p.quantity) : '-';
                  const avg = p.averagePrice != null ? fmt(p.averagePrice, 6) : '-';
                  const last = p.lastPrice != null ? fmt(p.lastPrice, 6) : '-';
                  const pnlRaw = p.pnl != null ? Number(p.pnl) : null;
                  const pnl = pnlRaw != null ? fmt(pnlRaw, 2) : '-';
                  const pnlCls = signClass(pnlRaw);
                  const effLot = Number(p.effectiveLot || p.lot || 0);
                  const isFutures = (p.instrumentType || '').toLowerCase().includes('future');
                  const units = p.positionUnits != null
                    ? fmtInt(p.positionUnits)
                    : effLot && p.quantity != null
                      ? fmtInt(Number(p.quantity) * effLot)
                      : null;
                  const notional = p.notional != null && isFinite(Number(p.notional)) ? fmt(Number(p.notional), 2) : null;

                  const rows = [];
                  rows.push(['Тикер', t]);
                  rows.push(['Название', name]);
                  rows.push(['Кол-во (контракты/шт.)', qty]);
                  if (isFutures && effLot) {
                    const ul = p.underlyingLot != null ? fmtInt(p.underlyingLot) : '-';
                    const fl = p.futuresLot != null ? fmtInt(p.futuresLot) : '-';
                    rows.push(['Эффективный лот', `${ul} × ${fl} = ${fmtInt(effLot)}`]);
                  } else if (effLot) {
                    rows.push(['Лот', fmtInt(effLot)]);
                  }
                  if (units) rows.push(['Размер позиции (ед.)', units]);
                  rows.push(['Средняя', avg]);
                  rows.push(['Текущая', last]);
                  if (notional) rows.push(['Notional', notional]);

                  let fundingRow = null;
                  try {
                    const st = (summary && summary.ticker) ? String(summary.ticker).toUpperCase() : null;
                    const pt = t ? String(t).toUpperCase() : null;
                    const fpu = summary && summary.fundingPerUnit != null ? Number(summary.fundingPerUnit) : null;
                    if (st && pt && st === pt && fpu != null) {
                      const posUnits = p.positionUnits != null ? Number(p.positionUnits) : (effLot && p.quantity != null ? Number(p.quantity) * effLot : null);
                      if (posUnits != null && isFinite(posUnits)) {
                        const cashFlow = -fpu * Number(posUnits);
                        if (isFinite(cashFlow)) {
                          fundingRow = ['Ожидаемый фандинг по позиции', `${fmt(cashFlow, 2)}`, signClass(cashFlow)];
                        }
                      }
                    }
                  } catch {}

                  return (
                    <div key={i} className="card" style={{ padding: 8, height: 'auto' }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{name} <span className="badge">{t}</span></div>
                      <table className="kv"><tbody>
                        {rows.map(([k, v, cls], idx) => (
                          <tr key={idx}><td>{k}</td><td className={`num ${cls || ''}`}>{v}</td></tr>
                        ))}
                        {fundingRow && (
                          <tr><td>{fundingRow[0]}</td><td className={`num ${fundingRow[2] || ''}`}>{fundingRow[1]}</td></tr>
                        )}
                      </tbody></table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="panel" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 id="chartTitle">Свечи ({scale}, сегодня)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <label htmlFor="scale" className="muted">Масштаб:</label>
                <select id="scale" value={scale} onChange={(e) => setScale(e.target.value)}>
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                </select>
              </div>
            </div>
          </div>
          <AnyChartStock candles={aggCandles} trades={trades} clearings={clearings} />
        </div>
      </section>
    </>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
