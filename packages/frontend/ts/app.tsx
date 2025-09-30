import React from 'react';
import {
  aggregateCandles,
  fmt,
  fmtInt,
  fmtPct,
  Scale,
} from './helpers';
import type {
  CandlePoint,
  Trade,
  Summary,
  SummaryLite,
  Position,
  Clearing,
} from './types';
import { useWebSocket } from './ws';
import { AnyChartStock } from './chart';
import { fetchJSON } from './helpers';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CssBaseline,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0f172a', paper: '#111827' },
  },
});

function numColor(val: unknown): string {
  const n = Number(val);
  if (!isFinite(n)) return 'text.primary';
  return n > 0 ? 'success.main' : n < 0 ? 'error.main' : 'text.secondary';
}

export function App() {
  const useState = React.useState;
  const useEffect = React.useEffect;
  const useMemo = React.useMemo;

  const [ticker, setTicker] = useState('CNYRUBF');
  const [status, setStatus] = useState('');
  const [scale, setScale] = useState('1m' as Scale);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [underlying, setUnderlying] = useState<SummaryLite | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [clearings, setClearings] = useState<Clearing[]>([]);

  const aggCandles = useMemo(
    () => aggregateCandles(candles, scale),
    [candles, scale],
  );

  // WS to update candles and live quotes
  useWebSocket(ticker, (msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'candles' && msg.mode === 'snapshot') {
      const pts = Array.isArray(msg.points) ? (msg.points as any[]) : [];
      setCandles(pts as any);
      if (Array.isArray(msg.clearings)) setClearings(msg.clearings as any);
    } else if (msg.type === 'candles' && msg.mode === 'update') {
      const pts = Array.isArray(msg.points) ? (msg.points as any[]) : [];
      setCandles((prev: any) => {
        const prevArr = Array.isArray(prev) ? (prev as any[]) : [];
        const map = new Map(prevArr.map((p: any) => [p.t, p] as const));
        for (const p of pts) if (p && (p as any).t) map.set((p as any).t, p as any);
        return Array.from(map.values()).sort(
          (a: any, b: any) => new Date(a.t).getTime() - new Date(b.t).getTime(),
        );
      });
    } else if (msg.type === 'quote') {
      if (msg.summary) setSummary(msg.summary);
      if (msg.underlying) setUnderlying(msg.underlying);
    } else if (msg.type === 'trades') {
      if (Array.isArray(msg.trades)) setTrades(msg.trades as any);
    } else if (msg.type === 'error') {
      console.warn('WS error:', (msg as any).message || msg);
    } else if (msg.type === 'pong') {
      // ignore
    }
  });

  async function loadAll(targetTicker?: string) {
    const t = (targetTicker || ticker || '').trim();
    if (!t) return;
    setStatus('Загрузка...');
    try {
      const [sum, candlesResp, tradesResp, posResp] = await Promise.all([
        fetchJSON<Summary>(`/api/summary?ticker=${encodeURIComponent(t)}`),
        fetchJSON<{ points: CandlePoint[] }>(
          `/api/candles?ticker=${encodeURIComponent(t)}`,
        ),
        fetchJSON<{ trades: Trade[] }>(
          `/api/trades?ticker=${encodeURIComponent(t)}`,
        ),
        fetchJSON<{ positions: Position[] }>(
          `/api/positions?ticker=${encodeURIComponent(t)}`,
        ),
      ]);
      setSummary(sum || null);
      if (sum && sum.underlying) setUnderlying(sum.underlying as SummaryLite);
      else setUnderlying(null);
      setCandles(((candlesResp as any) && (candlesResp as any).points) || []);
      setClearings(((candlesResp as any) && (candlesResp as any).clearings) || []);
      setTrades(((tradesResp as any) && (tradesResp as any).trades) || []);
      setPositions(((posResp as any) && (posResp as any).positions) || []);
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" color="default" enableColorOnDark>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Панель инструментов
          </Typography>
          <TextField
            id="ticker"
            label="Тикер"
            size="small"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="например, CNYRUBF"
          />
          <Button variant="contained" onClick={() => loadAll(ticker)}>
            Загрузить
          </Button>
          <Typography variant="body2" color="text.secondary">
            {status}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Инструмент" />
              <CardContent>
                {summary ? (
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Тикер</TableCell>
                        <TableCell align="right">
                          <Chip label={summary.ticker || '-'} size="small" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Название</TableCell>
                        <TableCell align="right">{summary.name || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Last</TableCell>
                        <TableCell align="right" sx={{ color: numColor(summary.lastPrice) }}>
                          {fmt(summary.lastPrice, 6)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Bid</TableCell>
                        <TableCell align="right">{fmt(summary.bestBid, 6)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Ask</TableCell>
                        <TableCell align="right">{fmt(summary.bestAsk, 6)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Спред</TableCell>
                        <TableCell align="right">{fmt(summary.spread, 6)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>VWAP (сегодня)</TableCell>
                        <TableCell align="right">{fmt(summary.vwap, 6)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Премия</TableCell>
                        <TableCell align="right" sx={{ color: numColor(summary.premium) }}>
                          {fmtPct(summary.premium, 4)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Оценка фандинга</TableCell>
                        <TableCell align="right" sx={{ color: numColor(summary.fundingRateEst) }}>
                          {fmtPct(summary.fundingRateEst, 4)}
                        </TableCell>
                      </TableRow>
                      {summary.fundingPerUnit != null && (
                        <TableRow>
                          <TableCell>Фандинг/ед.</TableCell>
                          <TableCell align="right" sx={{ color: numColor(summary.fundingPerUnit) }}>
                            {fmt(summary.fundingPerUnit, 6)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="text.secondary">Нет данных</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {underlying && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Базовый актив" />
                <CardContent>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Тикер</TableCell>
                        <TableCell align="right">
                          <Chip label={underlying.ticker || '-'} size="small" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Название</TableCell>
                        <TableCell align="right">{underlying.name || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Last</TableCell>
                        <TableCell align="right" sx={{ color: numColor(underlying.lastPrice) }}>
                          {fmt(underlying.lastPrice, 6)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>VWAP (сегодня)</TableCell>
                        <TableCell align="right">{fmt(underlying.vwap, 6)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          )}

          <Grid item xs={12}>
            <Card>
              <CardHeader title="Позиции" />
              <CardContent>
                {!positions || positions.length === 0 ? (
                  <Typography color="text.secondary">Нет открытых позиций</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {positions.map((p, i) => {
                      const t = p.ticker || p.figi || p.instrumentId || '-';
                      const name = p.name || '-';
                      const qty = p.quantity != null ? fmtInt(p.quantity) : '-';
                      const avg = p.averagePrice != null ? fmt(p.averagePrice, 6) : '-';
                      const last = p.lastPrice != null ? fmt(p.lastPrice, 6) : '-';
                      const effLot = Number(p.effectiveLot || p.lot || 0);
                      const isFutures = (p.instrumentType || '').toLowerCase().includes('future');
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

                      const rows: [string, any, string?][] = [];
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

                      let fundingRow: [string, string, string] | null = null;
                      try {
                        const st = summary && summary.ticker ? String(summary.ticker).toUpperCase() : null;
                        const pt = t ? String(t).toUpperCase() : null;
                        const fpu = summary && summary.fundingPerUnit != null ? Number(summary.fundingPerUnit) : null;
                        if (st && pt && st === pt && fpu != null) {
                          const posUnits =
                            p.positionUnits != null
                              ? Number(p.positionUnits)
                              : effLot && p.quantity != null
                                ? Number(p.quantity) * effLot
                                : null;
                          if (posUnits != null && isFinite(posUnits)) {
                            const cashFlow = -fpu * Number(posUnits);
                            if (isFinite(cashFlow)) {
                              fundingRow = ['Ожидаемый фандинг по позиции', `${fmt(cashFlow, 2)}`, ''];
                            }
                          }
                        }
                      } catch {}

                      return (
                        <Grid item xs={12} md={6} lg={4} key={i}>
                          <Card>
                            <CardContent>
                              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                                {name} <Chip label={t} size="small" sx={{ ml: 1 }} />
                              </Typography>
                              <Table size="small">
                                <TableBody>
                                  {rows.map(([k, v], idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{k}</TableCell>
                                      <TableCell align="right">{v}</TableCell>
                                    </TableRow>
                                  ))}
                                  {fundingRow && (
                                    <TableRow>
                                      <TableCell>{fundingRow[0]}</TableCell>
                                      <TableCell align="right" sx={{ color: numColor(fundingRow[1]) }}>
                                        {fundingRow[1]}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={`Свечи (${scale}, сегодня)`}
                action={
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="scale-label">Масштаб</InputLabel>
                    <Select
                      labelId="scale-label"
                      id="scale"
                      label="Масштаб"
                      value={scale}
                      onChange={(e) => setScale(e.target.value as Scale)}
                    >
                      <MenuItem value="1m">1m</MenuItem>
                      <MenuItem value="5m">5m</MenuItem>
                      <MenuItem value="15m">15m</MenuItem>
                      <MenuItem value="1h">1h</MenuItem>
                    </Select>
                  </FormControl>
                }
              />
              <CardContent>
                <AnyChartStock candles={aggCandles} trades={trades} clearings={clearings} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}
