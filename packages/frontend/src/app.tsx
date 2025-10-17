import React from 'react';
import { aggregateCandles, fetchJSON, Scale } from './helpers';
import type {
  CandlePoint,
  Clearing,
  Position,
  Summary,
  SummaryLite,
  Trade,
} from './types';
import { useWebSocket } from './ws';
import {
  Card,
  CardContent,
  CardHeader,
  Container,
  CssBaseline,
  Grid,
  Tab,
  Tabs,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Header } from './components/Header';
import { AnalyticsPanel } from './components/Analytics/AnalyticsPanel';
import { InstrumentSummary } from './components/Summary/InstrumentSummary';
import { UnderlyingSummary } from './components/Summary/UnderlyingSummary';
import { PositionsPanel } from './components/Positions/PositionsPanel';
import { CandlesPanel } from './components/Charts/CandlesPanel';
import { JobsList } from './components/Jobs/JobsList';
import { SourcesPanel } from './components/Sources/SourcesPanel';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0f172a', paper: '#111827' },
  },
});

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
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>(
    'overview',
  );
  const [route, setRoute] = useState<'instrument' | 'jobs' | 'analytics' | 'sources'>(
    () => {
      if (typeof window !== 'undefined' && window.location) {
        const h = window.location.hash;
        if (h === '#/jobs') return 'jobs';
        if (h === '#/analytics') return 'analytics';
        if (h === '#/sources') return 'sources';
      }
      return 'instrument';
    }
  );
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      if (h === '#/jobs') setRoute('jobs');
      else if (h === '#/analytics') setRoute('analytics');
      else if (h === '#/sources') setRoute('sources');
      else setRoute('instrument');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const aggCandles = useMemo(
    () => aggregateCandles(candles, scale),
    [candles, scale],
  );

  // WS to update candles and live quotes
  useWebSocket(ticker, (msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'candles' && msg.mode === 'snapshot') {
      const pts = Array.isArray(msg.points) ? (msg.points as any[]) : [];
      setCandles(pts);
      if (Array.isArray(msg.clearings)) setClearings(msg.clearings);
    } else if (msg.type === 'quote') {
      if (msg.summary) setSummary(msg.summary);
      if (msg.underlying) setUnderlying(msg.underlying);
    } else if (msg.type === 'trades') {
      if (Array.isArray(msg.trades)) setTrades(msg.trades);
    } else if (msg.type === 'error') {
      console.warn('WS error:', msg.message || msg);
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
        fetchJSON<{ points: CandlePoint[]; clearings: Clearing[] }>(
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
      setClearings((candlesResp && candlesResp.clearings) || []);
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header
        ticker={ticker}
        status={status}
        activeRoute={route}
        onNavigate={(r) => {
          if (r === 'jobs') window.location.hash = '#/jobs';
          else if (r === 'analytics') window.location.hash = '#/analytics';
          else if (r === 'sources') window.location.hash = '#/sources';
          else window.location.hash = '#/instrument';
        }}
        onTickerChange={setTicker}
        onLoad={() => loadAll(ticker)}
      />

      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {route === 'jobs' ? (
          <JobsList />
        ) : route === 'analytics' ? (
          <AnalyticsPanel />
        ) : route === 'sources' ? (
          <SourcesPanel />
        ) : (
          <>
            <Tabs
              value={activeTab}
              onChange={(_e, v) => setActiveTab(v)}
              sx={{ mb: 2 }}
            >
              <Tab label="Обзор" value="overview" />
              <Tab label="Аналитика" value="analytics" />
            </Tabs>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <InstrumentSummary summary={summary} />
                </Grid>

                {underlying && (
                  <Grid item xs={12} md={6}>
                    <UnderlyingSummary underlying={underlying} />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Позиции" />
                    <CardContent>
                      <PositionsPanel positions={positions} summary={summary} />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <CandlesPanel
                    scale={scale}
                    onScaleChange={(s) => setScale(s)}
                    candles={aggCandles}
                    trades={trades}
                    clearings={clearings}
                  />
                </Grid>
              </Grid>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}
