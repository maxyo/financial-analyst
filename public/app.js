const apiUrl = 'http://localhost:3000';
const anychart = window.anychart;
(function () {
  const el = (id) => document.getElementById(id);
  const tickerInput = el('ticker');
  const loadBtn = el('load');
  const statusEl = el('status');
  const titleEl = el('title');
  const summaryEl = el('summary');
  const chartContainerId = 'chart';
  const scaleSelect = el('scale');
  const chartTitleEl = el('chartTitle');
  // Underlying elements
  const underlyingCard = el('underlyingCard');
  const underlyingTitleEl = el('underlyingTitle');
  const underlyingSummaryEl = el('underlyingSummary');
  // Positions panel
  const positionsEl = el('positions');

  let chart;
  let dataTable = null;
  let rawCandles = [];
  let rawTrades = [];
  // Keep last loaded summary to use its funding info in positions panel
  let currentSummary = null;
  let currentScale =
    scaleSelect && scaleSelect.value ? scaleSelect.value : '1m';
  // Clearing markers and event markers state
  let rawClearings = [];
  // Unified event markers storage for plot0.eventMarkers()
  let tradeEventItems = [];
  let clearingEventItems = [];
  function applyEventMarkers() {
    if (!chart) return;
    try {
      const plot0 = chart.plot(0);
      plot0.eventMarkers().group(0).format('C').data(clearingEventItems);
      plot0.eventMarkers().group(1).format('B').data(tradeEventItems.filter((x) => x.type === 'triangle-up'));
      plot0.eventMarkers().group(2).format('S').data(tradeEventItems.filter((x) => x.type === 'triangle-down'));
    } catch (e) {
      console.warn('applyEventMarkers failed', e);
    }
  }

  // Underlying polling state
  let underlyingTicker = null;
  let underlyingTimer = null;
  function clearUnderlyingTimer() {
    if (underlyingTimer) {
      clearInterval(underlyingTimer);
      underlyingTimer = null;
    }
  }

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

  function signClass(v) {
    if (v == null || !isFinite(Number(v))) return '';
    return Number(v) > 0 ? 'pos' : Number(v) < 0 ? 'neg' : '';
  }

  function kvTable(rows) {
    // rows: [label, value, valueClass?]
    const trs = rows
      .map(
        ([k, v, cls]) =>
          `<tr><td>${k}</td><td class="num ${cls || ''}">${v}</td></tr>`,
      )
      .join('');
    return `<table class="kv"><tbody>${trs}</tbody></table>`;
  }

  function setStatus(msg) {
    statusEl.textContent = msg || '';
  }

  function setChartTitle() {
    if (chartTitleEl)
      chartTitleEl.textContent = `Свечи (${currentScale}, сегодня)`;
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

  function updateChart() {
    const pts = aggregateCandles(rawCandles, currentScale);
    setChartTitle();
    renderChart(pts);
  }

  function addTradesToChart() {
    if (!chart) return;
    if (!Array.isArray(rawTrades) || rawTrades.length === 0) {
      tradeEventItems = [];
      applyEventMarkers();
      return;
    }

    const items = [];
    for (const t of rawTrades) {
      if (!t || !t.t || t.p == null) continue;
      const ms = new Date(t.t).getTime();
      if (!isFinite(ms)) continue;
      const price = Number(t.p);
      const qty = t.q != null ? Number(t.q) : null;
      const side = (t.side || '').toLowerCase();
      const isBuy = side === 'buy';
      const isSell = side === 'sell';
      const color = isBuy ? '#22c55e' : isSell ? '#ef4444' : '#94a3b8';
      const type = isBuy ? 'triangle-up' : isSell ? 'triangle-down' : 'circle';
      items.push({
        x: ms,
        date: ms,
        value: price,
        type,
        direction: isBuy ? 'up' : isSell ? 'down' : 'auto',
        description: `Сделка ${isBuy ? 'BUY' : isSell ? 'SELL' : ''}\nЦена: ${fmt(price)}${qty != null ? `\nОбъём: ${fmtInt(qty)}` : ''}`,
        normal: { fill: color, stroke: { color, thickness: 1 } },
        hovered: { fill: color, stroke: { color, thickness: 2 } },
        selected: { fill: color, stroke: { color, thickness: 2 } },
      });
    }

    // Sort by time asc for stable rendering
    items.sort((a, b) => (a.x || 0) - (b.x || 0));

    tradeEventItems = items;
    applyEventMarkers();
  }

  function setTrades(trades) {
    rawTrades = Array.isArray(trades) ? trades.slice() : [];
    try {
      addTradesToChart();
    } catch (e) {
      console.warn('addTradesToChart error', e);
    }
  }

  function hideTrades() {
    try {
      tradeEventItems = [];
      applyEventMarkers();
    } catch (e) {
      // ignore
    }
  }


  function addClearingsToChart() {
    if (!chart) return;
    const data = Array.isArray(rawClearings) ? rawClearings : [];
    const items = data
      .map((c) => {
        if (!c || !c.t) return null;
        const ms = new Date(c.t).getTime();
        if (!isFinite(ms)) return null;
        return {
          x: ms,
          date: c.t,
          type: 'pin',
          direction: 'up',
          description: `Клиринг\nФандинг ~ ${fmtPct(c.fundingRateEst, 3)}`,
          normal: {
            fill: '#eab308',
            stroke: { color: '#eab308', thickness: 1 },
          },
          hovered: {
            fill: '#f59e0b',
            stroke: { color: '#f59e0b', thickness: 1 },
          },
          selected: {
            fill: '#fbbf24',
            stroke: { color: '#fbbf24', thickness: 1 },
          },
        };
      })
      .filter(Boolean);
    clearingEventItems = items;
    applyEventMarkers();
  }

  async function loadTrades(ticker) {
    try {
      const data = await fetchJSON(
        `/api/trades?ticker=${encodeURIComponent(ticker)}`,
      );
      setTrades((data && data.trades) || []);
    } catch (e) {
      console.warn('Не удалось загрузить сделки', e);
      setTrades([]);
    }
  }

  function upsertLiveFromQuote(summary, ts) {
    if (!summary || summary.lastPrice == null) return;
    const price = Number(summary.lastPrice);
    if (!isFinite(price)) return;
    const dt = ts ? new Date(ts) : new Date();
    const tms = dt.getTime();
    if (!isFinite(tms)) return;
    const bucket = Math.floor(tms / (60 * 1000)) * 60 * 1000;
    const iso = new Date(bucket).toISOString();
    if (!Array.isArray(rawCandles)) rawCandles = [];
    const last = rawCandles.length ? rawCandles[rawCandles.length - 1] : null;
    const lastBucket = last
      ? Math.floor(new Date(last.t).getTime() / (60 * 1000)) * 60 * 1000
      : null;
    if (last && lastBucket === bucket) {
      // update current minute candle
      last.c = price;
      if (last.h == null || price > last.h) last.h = price;
      if (last.l == null || price < last.l) last.l = price;
    } else if (last == null || (lastBucket != null && bucket > lastBucket)) {
      // append new minute candle
      rawCandles.push({ t: iso, o: price, h: price, l: price, c: price, v: 0 });
    } else {
      // out-of-order update: ignore for simplicity
      return;
    }
  }

  // Apply candles from WS
  function applyCandlesSnapshot(points) {
    rawCandles = Array.isArray(points) ? points.slice() : [];
    updateChart();
  }
  function applyCandlesUpdate(points) {
    if (!Array.isArray(points) || points.length === 0) return;
    if (!Array.isArray(rawCandles)) rawCandles = [];
    for (const p of points) {
      if (!p || !p.t) continue;
      const idx = rawCandles.findIndex((x) => x && x.t === p.t);
      if (idx >= 0) rawCandles[idx] = p;
      else rawCandles.push(p);
    }
    rawCandles.sort(
      (a, b) => new Date(a.t).getTime() - new Date(b.t).getTime(),
    );
    updateChart();
  }

  async function fetchJSON(url) {
    const res = await fetch(`${apiUrl}${url}`);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    return res.json();
  }

  function renderPositions(list) {
    if (!positionsEl) return;
    try {
      if (!Array.isArray(list) || list.length === 0) {
        positionsEl.classList.add('muted');
        positionsEl.textContent = 'Нет открытых позиций';
        return;
      }
      const cards = list
        .map((p) => {
          const t = p.ticker || p.figi || p.instrumentId || '-';
          const name = p.name || '-';
          const qty = p.quantity != null ? fmtInt(p.quantity) : '-';
          const avg = p.averagePrice != null ? fmt(p.averagePrice, 6) : '-';
          const last = p.lastPrice != null ? fmt(p.lastPrice, 6) : '-';
          const pnlRaw = p.pnl != null ? Number(p.pnl) : null;
          const pnl = pnlRaw != null ? fmt(pnlRaw, 2) : '-';
          const pnlCls = signClass(pnlRaw);
          const effLot = Number(p.effectiveLot || p.lot || 0);
          const isFutures =
            (p.instrumentType || '').toLowerCase().includes('futures') ||
            (p.instrumentType || '').toLowerCase().includes('future');
          const units =
            p.positionUnits != null
              ? fmtInt(p.positionUnits)
              : effLot && p.quantity != null
                ? fmtInt(Number(p.quantity) * effLot)
                : null;
          const notional =
            p.notional != null && isFinite(Number(p.notional))
              ? fmt(Number(p.notional), 2)
              : null;
          const rows = [
            ['Тикер', t],
            ['Название', name],
            ['Кол-во (контракты/шт.)', qty],
          ];
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
          rows.push(['PnL', pnl, pnlCls]);
          // Expected funding for current position (uses latest summary fundingPerUnit)
          try {
            const st = (currentSummary && currentSummary.ticker) ? String(currentSummary.ticker).toUpperCase() : null;
            const pt = t ? String(t).toUpperCase() : null;
            const fpu = currentSummary && currentSummary.fundingPerUnit != null ? Number(currentSummary.fundingPerUnit) : null;
            if (st && pt && st === pt && fpu != null) {
              const posUnits = p.positionUnits != null
                ? Number(p.positionUnits)
                : (effLot && p.quantity != null ? Number(p.quantity) * effLot : null);
              if (posUnits != null && isFinite(posUnits)) {
                const cashFlow = -fpu * Number(posUnits); // положительный фандинг: лонги платят шортам
                if (isFinite(cashFlow)) {
                  rows.push(['Ожидаемый фандинг по позиции', `${fmt(cashFlow, 2)}`, signClass(cashFlow)]);
                }
              }
            }
          } catch (e) {
            // ignore rendering funding errors
          }
          return `<div class="card" style="padding:8px; height:auto;">
          <div style="font-weight:600; margin-bottom:6px;">${name} <span class="badge">${t}</span></div>
          ${kvTable(rows)}
        </div>`;
        })
        .join('');
      positionsEl.classList.remove('muted');
      positionsEl.innerHTML = `<div class="grid">${cards}</div>`;
    } catch (e) {
      positionsEl.textContent = 'Ошибка рендера позиций';
      console.error(e);
    }
  }

  async function loadPositions(onlyTicker) {
    if (!positionsEl) return;
    try {
      positionsEl.classList.add('muted');
      positionsEl.textContent = 'Загрузка...';
      const data = await fetchJSON(`/api/positions?ticker=${onlyTicker}`);
      let list = (data && data.positions) || [];
      if (onlyTicker) {
        const t = String(onlyTicker).toUpperCase();
        list = list.filter(
          (p) => p && p.ticker && String(p.ticker).toUpperCase() === t,
        );
      }
      renderPositions(list);
    } catch (e) {
      positionsEl.classList.add('muted');
      positionsEl.textContent = 'Ошибка загрузки позиций';
      console.error(e);
    }
  }

  function hideUnderlying() {
    clearUnderlyingTimer();
    underlyingTicker = null;
    if (underlyingCard) {
      underlyingCard.style.display = 'none';
    }
    if (underlyingTitleEl) underlyingTitleEl.textContent = 'Базовый актив';
    if (underlyingSummaryEl) underlyingSummaryEl.innerHTML = '';
  }

  function fmtPct(x, digits = 2) {
    if (x == null || Number.isNaN(x)) return '-';
    try {
      return new Intl.NumberFormat('ru-RU', {
        style: 'percent',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(Number(x));
    } catch {
      return `${(Number(x) * 100).toFixed(digits)}%`;
    }
  }
  function fmtDT(x) {
    const d = new Date(x);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderUnderlyingSummary(s) {
    if (!underlyingCard || !underlyingTitleEl || !underlyingSummaryEl) return;
    underlyingCard.style.display = 'block';
    underlyingTitleEl.textContent = `${s.name} (${s.ticker})`;
    const rows = [];
    if (s.lot != null) rows.push(['Лот', fmtInt(s.lot)]);
    if (s.lastPrice != null) rows.push(['Текущая цена', fmt(s.lastPrice)]);
    if (s.bestBid != null) rows.push(['Лучшая покупка (bid)', fmt(s.bestBid)]);
    if (s.bestAsk != null) rows.push(['Лучшая продажа (ask)', fmt(s.bestAsk)]);
    if (s.spread != null) rows.push(['Спред', fmt(s.spread)]);
    if (s.dayHigh != null) rows.push(['Макс за день', fmt(s.dayHigh)]);
    if (s.dayLow != null) rows.push(['Мин за день', fmt(s.dayLow)]);
    if (s.changeAbs != null && s.changePct != null)
      rows.push([
        'Изменение за день',
        `${fmt(s.changeAbs)} (${fmtPct(s.changePct, 2)})`,
        signClass(s.changeAbs ?? s.changePct),
      ]);
    if (s.vwap != null) rows.push(['VWAP (с начала дня)', fmt(s.vwap)]);
    underlyingSummaryEl.innerHTML = kvTable(rows);
  }

  async function showUnderlyingFor(mainTicker) {
    if (!mainTicker) {
      hideUnderlying();
      return;
    }
    try {
      // First resolve and render underlying summary for the futures ticker
      const s = await fetchJSON(
        `/api/underlying-summary?ticker=${encodeURIComponent(mainTicker)}`,
      );
      renderUnderlyingSummary(s);
      underlyingTicker = s && s.ticker ? s.ticker : null;
      // Stop REST polling; underlying will update via WS 'quote.underlying'
      clearUnderlyingTimer();
    } catch (e) {
      // If cannot resolve underlying (e.g., not a future), hide the card
      hideUnderlying();
    }
  }

  function renderSummary(s) {
    currentSummary = s;
    titleEl.textContent = `${s.name} (${s.ticker}) FIGI=${s.figi}`;
    const rows = [];
    if (s.lot != null) rows.push(['Лот', fmtInt(s.lot)]);
    if (s.lastPrice != null) rows.push(['Текущая цена', fmt(s.lastPrice)]);
    if (s.bestBid != null) rows.push(['Лучшая покупка (bid)', fmt(s.bestBid)]);
    if (s.bestAsk != null) rows.push(['Лучшая продажа (ask)', fmt(s.bestAsk)]);
    if (s.spread != null) rows.push(['Спред', fmt(s.spread)]);
    if (s.dayHigh != null) rows.push(['Макс за день', fmt(s.dayHigh)]);
    if (s.dayLow != null) rows.push(['Мин за день', fmt(s.dayLow)]);
    if (s.changeAbs != null && s.changePct != null)
      rows.push([
        'Изменение за день',
        `${fmt(s.changeAbs)} (${fmtPct(s.changePct, 2)})`,
        signClass(s.changeAbs ?? s.changePct),
      ]);
    if (s.volumeSum != null)
      rows.push(['Объём (1m, с начала дня)', fmtInt(s.volumeSum)]);
    if (s.vwap != null) rows.push(['VWAP (с начала дня)', fmt(s.vwap)]);
    if (s.premium != null)
      rows.push(['Премия к VWAP', fmtPct(s.premium, 2), signClass(s.premium)]);
    if (s.fundingRateEst != null)
      rows.push([
        'Оценка дневного фандинга',
        fmtPct(s.fundingRateEst, 3),
        signClass(s.fundingRateEst),
      ]);
    if (s.nextFundingTime) {
      const when = fmtDT(s.nextFundingTime);
      const mins =
        s.minutesToFunding != null ? `${fmtInt(s.minutesToFunding)} мин` : '-';
      rows.push([
        'След. фандинг (ежедневно 19:00 МСК)',
        `${when} (через ~${mins})`,
      ]);
    }
    if (s.fundingPerUnit != null) {
      rows.push([
        'Фандинг (на 1 ед.)',
        fmt(s.fundingPerUnit, 6),
        signClass(s.fundingPerUnit),
      ]);
      if (s.lot != null) {
        const perContract = Number(s.fundingPerUnit) * Number(s.lot);
        if (isFinite(perContract))
          rows.push([
            'Фандинг (на 1 контракт)',
            fmt(perContract, 4),
            signClass(perContract),
          ]);
      }
      if (s.fundingD != null)
        rows.push(['D (среднее отклонение)', fmt(s.fundingD, 6)]);
      if (s.fundingL1 != null) rows.push(['L1', fmt(s.fundingL1, 6)]);
      if (s.fundingL2 != null) rows.push(['L2', fmt(s.fundingL2, 6)]);
      if (s.fundingMode)
        rows.push([
          'Режим расчёта',
          `<span class="badge">${s.fundingMode}</span>`,
        ]);
    }
    summaryEl.innerHTML = kvTable(rows);
  }

  function renderChart(points) {
    // Prepare data for AnyStock: [timestamp(ms), open, high, low, close, volume]
    const rows = (points || []).map((p) => {
      const t = p && p.t ? new Date(p.t).getTime() : Date.now();
      return [t, p.o ?? null, p.h ?? null, p.l ?? null, p.c ?? null, p.v ?? 0];
    });

    if (chart) {
      try {
        chart.dispose();
      } catch (e) {
        // ignore
      }
      chart = null;
    }

    if (window.anychart && anychart.format) {
      anychart.format.inputLocale('ru-ru');
      anychart.format.outputLocale('ru-ru');
    }

    chart = anychart.stock();
    chart.background().fill('transparent');

    dataTable = anychart.data.table();
    dataTable.addData(rows);

    const ohlcMapping = dataTable.mapAs({ open: 1, high: 2, low: 3, close: 4 });
    const volMapping = dataTable.mapAs({ value: 5 });
    const closeMapping = dataTable.mapAs({ value: 4 });

    const plot0 = chart.plot(0);
    plot0.legend().enabled(false);
    plot0.yGrid(true).xGrid(true);
    const candle = plot0.candlestick(ohlcMapping);
    candle.name('Свечи');
    // Axis labels with grouping and readable crosshair/tooltip
    plot0.yAxis().labels().format('{%value}{groupsSeparator: }');
    chart.crosshair().enabled(true);
    chart.crosshair().yLabel().format('{%value}{groupsSeparator: }');
    chart.crosshair().xLabel().format('{%value}{dateTimeFormat: dd.MM HH:mm}');
    candle
      .tooltip()
      .useHtml(true)
      .titleFormat('{%x}{dateTimeFormat: dd.MM.yyyy HH:mm}')
      .format(
        'O: {%open}{groupsSeparator: }\nH: {%high}{groupsSeparator: }\nL: {%low}{groupsSeparator: }\nC: {%close}{groupsSeparator: }',
      );

    const plot1 = chart.plot(1);
    plot1.legend().enabled(false);
    plot1.height('30%');
    plot1.yGrid(true).xGrid(true);
    plot1.yAxis().labels().format('{%value}{groupsSeparator: }');
    const volume = plot1.column(volMapping);
    volume.name('Объём').fill('rgba(34,197,94,0.6)').stroke(null);
    volume.tooltip().format('Объём: {%value}{groupsSeparator: }');

    chart.scroller().line(closeMapping);

    chart.container(chartContainerId);

    // Add clearing markers
    try {
      addClearingsToChart();
    } catch (e) {
      console.warn('addClearingsToChart failed', e);
    }

    // After base chart is drawn, add trades overlay if enabled
    try {
      addTradesToChart();
    } catch (e) {
      console.warn('addTradesToChart failed', e);
    }
    chart.draw();
  }

  // Realtime via WebSocket
  let ws = null;
  let desiredTicker = null;
  let subscribedTicker = null;
  let reconnectAttempt = 0;
  let pingTimer = null;

  function wsUrl() {
    try {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const host = apiUrl.replace(/^https?:\/\//, '');
      return `${proto}://${host}/ws`;
    } catch {
      return 'ws://localhost:3000/ws';
    }
  }

  function clearPing() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  function connectWS() {
    if (
      ws &&
      (ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING)
    )
      return;
    try {
      ws = new WebSocket(wsUrl());
    } catch (e) {
      scheduleReconnect();
      return;
    }
    ws.onopen = () => {
      setStatus('WS: подключено');
      reconnectAttempt = 0;
      clearPing();
      // keepalive ping every 25s
      pingTimer = setInterval(() => {
        try {
          ws.send(JSON.stringify({ type: 'ping' }));
        } catch (e) {
          // ignore
        }
      }, 25000);
      // resubscribe
      if (desiredTicker) sendSubscribe(desiredTicker);
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'quote' && msg.ticker && msg.summary) {
          if (
            !desiredTicker ||
            msg.ticker.toUpperCase() === String(desiredTicker).toUpperCase()
          ) {
            renderSummary(msg.summary);
            upsertLiveFromQuote(msg.summary, msg.ts);
            // If server provided underlying summary, update the underlying card without REST polling
            if (msg.underlying) {
              try { renderUnderlyingSummary(msg.underlying); } catch (e) { /* ignore */ }
            }
            updateChart();
            setStatus(`Обновлено: ${new Date().toLocaleTimeString('ru-RU')}`);
          }
        } else if (msg.type === 'trades' && msg.ticker) {
          if (
            !desiredTicker ||
            msg.ticker.toUpperCase() === String(desiredTicker).toUpperCase()
          ) {
            try { setTrades(Array.isArray(msg.trades) ? msg.trades : []); } catch (e) { /* ignore */ }
          }
        } else if (msg.type === 'candles' && msg.ticker) {
          if (
            !desiredTicker ||
            msg.ticker.toUpperCase() === String(desiredTicker).toUpperCase()
          ) {
            if (msg.mode === 'snapshot') {
              rawClearings = Array.isArray(msg.clearings) ? msg.clearings : [];
              applyCandlesSnapshot(msg.points || []);
            } else if (msg.mode === 'update') {
              applyCandlesUpdate(msg.points || []);
            }
            setStatus(
              `Свечи обновлены: ${new Date().toLocaleTimeString('ru-RU')}`,
            );
          }
        } else if (msg.type === 'subscribed') {
          subscribedTicker = msg.ticker || subscribedTicker;
        } else if (msg.type === 'unsubscribed') {
          if (
            subscribedTicker &&
            msg.ticker &&
            msg.ticker.toUpperCase() === subscribedTicker.toUpperCase()
          ) {
            subscribedTicker = null;
          }
        } else if (msg.type === 'error' && msg.message) {
          console.warn('WS error:', msg.message);
        }
      } catch (e) {
        // ignore
      }
    };
    ws.onerror = () => {
      setStatus('WS: ошибка соединения');
    };
    ws.onclose = () => {
      setStatus('WS: отключено, переподключение...');
      clearPing();
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    reconnectAttempt = Math.min(reconnectAttempt + 1, 6);
    const delay = 500 * Math.pow(2, reconnectAttempt - 1); // 0.5s,1s,2s,4s,8s,16s
    setTimeout(() => connectWS(), delay);
  }

  function sendSubscribe(t) {
    desiredTicker = t;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (
      subscribedTicker &&
      subscribedTicker.toUpperCase() !== t.toUpperCase()
    ) {
      try {
        ws.send(
          JSON.stringify({ type: 'unsubscribe', ticker: subscribedTicker }),
        );
      } catch (e) {
        // ignore
      }
    }
    try {
      ws.send(JSON.stringify({ type: 'subscribe', ticker: t }));
    } catch (e) {
      // ignore
    }
  }

  function sendUnsubscribe(t) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: 'unsubscribe', ticker: t }));
    } catch (e) {
      // ignore
    }
    if (
      subscribedTicker &&
      subscribedTicker.toUpperCase() === String(t).toUpperCase()
    )
      subscribedTicker = null;
  }

  async function load() {
    const t = (tickerInput.value || '').trim();
    if (!t) return;
    // Clear any previous underlying polling/state while switching instruments
    hideUnderlying();
    // Reset trades overlay when switching ticker
    hideTrades();
    rawTrades = [];
    try {
      setStatus('Загрузка...');
      const [summary, candles] = await Promise.all([
        fetchJSON(`/api/summary?ticker=${encodeURIComponent(t)}`),
        fetchJSON(`/api/candles?ticker=${encodeURIComponent(t)}`),
      ]);
      renderSummary(summary);
      rawCandles = (candles && candles.points) || [];
      rawClearings = Array.isArray(candles && candles.clearings)
        ? candles.clearings
        : [];
      updateChart();
      setStatus('');
      // Ensure WS connected and subscribed
      connectWS();
      sendSubscribe(t);
      // Try to show underlying (if ticker is a future and can be resolved)
      try {
        await showUnderlyingFor(t);
      } catch (e) {
        // ignore
      }
      // Load position only for the selected ticker
      loadPositions(t);
      // Load recent trades for the ticker (last ~hour)
      loadTrades(t);
    } catch (e) {
      console.error(e);
      setStatus('Ошибка загрузки данных');
      // Hide underlying on error
      hideUnderlying();
      // Still try to load positions filtered by the requested ticker even if ticker failed
      try {
        await loadPositions(t);
      } catch (e) {
        // ignore
      }
      // Attempt to load trades anyway
      try {
        await loadTrades(t);
      } catch (e) {
        // ignore
      }
    }
  }

  loadBtn.addEventListener('click', load);
  tickerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') load();
  });
  if (scaleSelect) {
    scaleSelect.addEventListener('change', () => {
      currentScale = scaleSelect.value || '1m';
      updateChart();
    });
  }

  // set initial title
  setChartTitle();

  // initial load
  load();
  // also load positions once initially (filtered by current input)
  loadPositions((tickerInput.value || '').trim());

  window.addEventListener('beforeunload', () => {
    try {
      if (ws) ws.close();
    } catch (e) {
      // ignore
    }
    clearPing();
  });
})();
