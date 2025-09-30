import React from 'react';
import Chart from 'react-apexcharts';
import { fmt } from './helpers';
import type { CandlePoint, Trade, Clearing } from './types';

interface Props {
  candles?: CandlePoint[];
  trades?: Trade[];
  clearings?: Clearing[];
}

// Replaces AnyChart implementation with React ApexCharts candlestick + annotations
export function AnyChartStock({ candles, trades, clearings }: Props) {
  const pts = Array.isArray(candles) ? candles : [];

  // Build a quick lookup for candle by timestamp to place clearing markers near price
  const candleByTs = React.useMemo(() => {
    const map = new Map<number, CandlePoint>();
    for (const c of pts) {
      const ms = new Date((c as any).t).getTime();
      if (isFinite(ms)) map.set(ms, c);
    }
    return map;
  }, [pts]);

  // Series for ApexCharts candlestick
  const series = React.useMemo(() => {
    const data = pts
      .map((c) => {
        const ms = new Date((c as any).t).getTime();
        if (!isFinite(ms)) return null;
        const o = Number((c as any).o);
        const h = Number((c as any).h);
        const l = Number((c as any).l);
        const cl = Number((c as any).c);
        if ([o, h, l, cl].some((v) => !isFinite(v))) return null;
        return { x: ms, y: [o, h, l, cl] } as const;
      })
      .filter(Boolean) as { x: number; y: [number, number, number, number] }[];
    return [{ name: 'Цена', data }];
  }, [pts]);

  // Annotations for trades and clearings
  const annotations = React.useMemo(() => {
    const tradePoints = (Array.isArray(trades) ? trades : [])
      .map((t) => {
        if (!t || !t.t || (t as any).p == null) return null;
        const x = new Date(t.t).getTime();
        if (!isFinite(x)) return null;
        const price = Number((t as any).p);
        if (!isFinite(price)) return null;
        const qty = (t as any).q != null ? Number((t as any).q) : null;
        const side = ((t as any).side || '').toLowerCase();
        const isBuy = side === 'buy';
        const isSell = side === 'sell';
        const color = isBuy ? '#22c55e' : isSell ? '#ef4444' : '#94a3b8';
        const labelText = isBuy ? 'B' : isSell ? 'S' : 'T';
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
        } as any;
      })
      .filter(Boolean) as any[];

    const clearingPoints = (Array.isArray(clearings) ? clearings : [])
      .map((c) => {
        if (!c || !c.t) return null;
        const x = new Date(c.t).getTime();
        if (!isFinite(x)) return null;
        const candle = candleByTs.get(x);
        const y = candle ? Number((candle as any).c) : undefined;
        const text = `C`;
        const color = '#eab308';
        const funding = (c as any).fundingRateEst;
        return {
          x,
          y,
          marker: { size: 3, fillColor: color, strokeColor: color },
          label: {
            text,
            borderColor: color,
            style: { background: '#0b1222', color: '#fde68a' },
          },
          // Additional context shown in tooltip formatter
          _meta: { funding },
        } as any;
      })
      .filter(Boolean) as any[];

    return { points: [...clearingPoints, ...tradePoints] } as const;
  }, [trades, clearings, candleByTs]);

  const options: any = React.useMemo(() => ({
    chart: {
      type: 'candlestick',
      animations: { enabled: false },
      toolbar: { show: false },
      background: '#0b1222',
      foreColor: '#cbd5e1',
      id: 'chart-candles',
    },
    theme: { mode: 'dark' },
    grid: { show: true, borderColor: '#1f2937' },
    xaxis: { type: 'datetime' },
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
  }), [annotations]);

  return (
    <Chart
      options={options}
      series={series as any}
      type="candlestick"
      height={420}
      width="100%"
    />
  );
}
