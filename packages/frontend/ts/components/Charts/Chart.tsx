import React from 'react';
import Chart from 'react-apexcharts';
import { fmt } from '../../helpers';
import type { CandlePoint, Clearing, Trade } from '../../types';

interface Props {
  candles?: CandlePoint[];
  trades?: Trade[];
  clearings?: Clearing[];
}

// Replaces AnyChart implementation with React ApexCharts candlestick + annotations
export function AnyChartStock({ candles, trades, clearings }: Props) {
  const pts = Array.isArray(candles) ? candles : [];

  // Filter out zero candles (o=h=l=c=0)
  const filteredPts = React.useMemo(() => {
    return pts.filter((c) => {
      const o = Number(c.o);
      const h = Number(c.h);
      const l = Number(c.l);
      const cl = Number(c.c);
      if ([o, h, l, cl].some((v) => !isFinite(v))) return false;
      return !(o === 0 && h === 0 && l === 0 && cl === 0);
    });
  }, [pts]);

  // Build a quick lookup for candle by timestamp to place clearing markers near price
  const candleByTs = React.useMemo(() => {
    const map = new Map<number, CandlePoint>();
    for (const c of filteredPts) {
      const ms = new Date(c.t).getTime();
      if (isFinite(ms)) map.set(ms, c);
    }
    return map;
  }, [filteredPts]);

  // Precompute visible bounds: prevent future panning, allow moving back to earliest data
  const [minX, maxX] = React.useMemo(() => {
    if (filteredPts.length === 0) return [undefined, Math.min(Date.now(), Date.now())] as const;
    const xs = filteredPts
      .map((c) => new Date(c.t).getTime())
      .filter((v) => isFinite(v))
      .sort((a, b) => a - b);
    const min = xs[0];
    const lastDataTs = xs[xs.length - 1];
    const now = Date.now();
    const max = Math.min(now, lastDataTs);
    return [min, max] as const;
  }, [filteredPts]);

  // Series for ApexCharts candlestick
  const series = React.useMemo(() => {
    const data = filteredPts
      .map((c) => {
        const ms = new Date(c.t).getTime();
        if (!isFinite(ms)) return null;
        const o = Number(c.o);
        const h = Number(c.h);
        const l = Number(c.l);
        const cl = Number(c.c);
        if ([o, h, l, cl].some((v) => !isFinite(v))) return null;
        if (o === 0 && h === 0 && l === 0 && cl === 0) return null; // additional safety
        return { x: ms, y: [o, h, l, cl] } as const;
      })
      .filter(Boolean) as { x: number; y: [number, number, number, number] }[];
    return [{ name: 'Цена', data }];
  }, [filteredPts]);

  // Annotations for trades and clearings
  const annotations = React.useMemo(() => {
    const tradePoints = (Array.isArray(trades) ? trades : [])
      .map((t) => {
        if (!t || !t.t || t.p == null) return null;
        const x = new Date(t.t).getTime();
        if (!isFinite(x)) return null;
        const price = Number(t.p);
        if (!isFinite(price)) return null;
        const qty = t.q != null ? Number(t.q) : null;
        const side = (t.side || '').toLowerCase();
        const isBuy = side === 'buy';
        const isSell = side === 'sell';
        const color = isBuy ? '#22c55e' : isSell ? '#ef4444' : '#94a3b8';
        const labelText = `${isBuy ? 'B' : 'S'} ${price}/${qty}`;
        return {
          x,
          y: price,
          marker: { size: 3, fillColor: color, strokeColor: color },
          label: {
            text: labelText,
            borderColor: color,
            style: { background: '#0b1222', color: '#e2e8f0' },
          },
          // Tooltip via label text approximation
        };
      })
      .filter(Boolean) as any[];

    const clearingPoints = (Array.isArray(clearings) ? clearings : [])
      .map((c) => {
        if (!c || !c.t) return null;
        const x = new Date(c.t).getTime();
        if (!isFinite(x)) return null;
        const candle = candleByTs.get(x);
        const y = candle ? Number(candle.c) : undefined;
        const color = '#eab308';
        const funding = c.fundingRateEst;
        return {
          x,
          y,
          marker: { size: 3, fillColor: color, strokeColor: color },
          label: {
            text: `Clearing: ${fmt((c.fundingRateEst ?? 0) * 100, 5)}%`,
            borderColor: color,
            style: { background: '#0b1222', color: '#fde68a' },
          },
          // Additional context shown in tooltip formatter
          _meta: { funding },
        };
      })
      .filter(Boolean) as any[];

    return { xaxis: [...clearingPoints, ...tradePoints] } as const;
  }, [trades, clearings, candleByTs]);

  const options: any = React.useMemo(
    () => ({
      chart: {
        type: 'candlestick',
        animations: { enabled: false },
        background: '#0b1222',
        foreColor: '#cbd5e1',
        id: 'chart-candles',
        zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
          autoSelected: 'pan',
        },
      },
      theme: { mode: 'dark' },
      grid: { show: true, borderColor: '#1f2937' },
      xaxis: { type: 'datetime', min: minX, max: maxX },
      yaxis: {
        decimalsInFloat: 2,
        tooltip: { enabled: true },
      },
      tooltip: {
        shared: false,
        x: { format: 'dd MMM HH:mm' },
        y: {
          formatter: (val: number) => (isFinite(val) ? fmt(val) : ''),
        },
      },
      annotations,
    }),
    [annotations, minX, maxX],
  );

  return (
    <Chart
      options={options}
      series={series}
      type="candlestick"
      height={420}
      width="100%"
    />
  );
}
