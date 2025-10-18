import React from 'react';
import { fetchJSON } from './helpers';
import type {
  CandlePoint,
  Clearing,
  Position,
  Summary,
  SummaryLite,
  Trade,
} from './types';
// import { useWebSocket } from './ws';
import {
  Card,
  CardContent,
  CardHeader,
  Container,
  CssBaseline,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Header } from './components/Header';
import { AnalyticsPanel } from './components/Analytics/AnalyticsPanel';
import { ReportsPage } from './components/Analytics/ReportsPage';
import { ProfileEditPage } from './components/Analytics/ProfileEditPage';
import { ScraperEditPage } from './components/Sources/ScraperEditPage';
import { JobsList } from './components/Jobs/JobsList';
import { SourcesPanel } from './components/Sources/SourcesPanel';

function ReportsRouterView() {
  const [profileId, setProfileId] = React.useState<number | null>(null);
  const [profileName, setProfileName] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const h = (typeof window !== 'undefined' && window.location ? window.location.hash : '') || '';
    // Accept formats: #/reports?profileId=123 or #/reports/123
    let id: number | null = null;
    if (h.startsWith('#/reports/')) {
      const tail = h.substring('#/reports/'.length);
      const n = Number(tail.split(/[?#]/)[0]);
      if (Number.isFinite(n)) id = n;
    } else if (h.startsWith('#/reports')) {
      const m = h.match(/profileId=(\d+)/);
      if (m && m[1]) {
        const n = Number(m[1]);
        if (Number.isFinite(n)) id = n;
      }
    }
    setProfileId(id);
    // Optionally, can parse profileName from hash too, e.g., &name=...
    const mName = h.match(/name=([^&#]+)/);
    if (mName && mName[1]) try { setProfileName(decodeURIComponent(mName[1])); } catch {}
  }, []);

  const onBack = React.useCallback(() => {
    window.history.back();
  }, []);

  if (!profileId) {
    return <Typography variant="body2" color="error">Не указан profileId</Typography>;
  }
  return <ReportsPage profileId={profileId} profileName={profileName} onBack={onBack} />;
}

function ProfileRouterView() {
  const [id, setId] = React.useState<number | undefined>(undefined);
  React.useEffect(() => {
    const h = (typeof window !== 'undefined' && window.location ? window.location.hash : '') || '';
    if (h === '#/profile/new') {
      setId(undefined);
    } else if (h.startsWith('#/profile/')) {
      const tail = h.substring('#/profile/'.length);
      const n = Number(tail.split(/[?#]/)[0]);
      if (Number.isFinite(n)) setId(n);
    }
  }, []);
  const onBack = React.useCallback(() => { window.history.back(); }, []);
  return <ProfileEditPage id={id} onBack={onBack} />;
}

function ScraperRouterView() {
  const [id, setId] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    const h = (typeof window !== 'undefined' && window.location ? window.location.hash : '') || '';
    if (h === '#/scraper/new') {
      setId(undefined);
    } else if (h.startsWith('#/scraper/')) {
      const tail = h.substring('#/scraper/'.length);
      const idStr = tail.split(/[?#]/)[0];
      if (idStr) setId(idStr);
    }
  }, []);
  const onBack = React.useCallback(() => { window.history.back(); }, []);
  return <ScraperEditPage id={id} onBack={onBack} />;
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0f172a', paper: '#111827' },
  },
});

export function App() {
  const useState = React.useState;
  const useEffect = React.useEffect;

  const [ticker, setTicker] = useState('CNYRUBF');
  const [status, setStatus] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [underlying, setUnderlying] = useState<SummaryLite | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [clearings, setClearings] = useState<Clearing[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>(
    'overview',
  );
  const [route, setRoute] = useState<'jobs' | 'analytics' | 'sources' | 'reports' | 'profile' | 'scraper'>(
    () => {
      if (typeof window !== 'undefined' && window.location) {
        const h = window.location.hash;
        if (h === '#/jobs') return 'jobs';
        if (h === '#/analytics') return 'analytics';
        if (h === '#/sources') return 'sources';
        if (h.startsWith('#/reports')) return 'reports';
        if (h.startsWith('#/profile')) return 'profile';
        if (h.startsWith('#/scraper')) return 'scraper';
      }
      return 'analytics';
    }
  );
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash;
      if (h === '#/jobs') setRoute('jobs');
      else if (h === '#/analytics') setRoute('analytics');
      else if (h === '#/sources') setRoute('sources');
      else if (h.startsWith('#/reports')) setRoute('reports');
      else if (h.startsWith('#/profile')) setRoute('profile');
      else if (h.startsWith('#/scraper')) setRoute('scraper');
      else setRoute('analytics');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);



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
          else window.location.hash = '#/analytics';
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
        ) : route === 'reports' ? (
          <Card>
            <CardHeader title="Аналитика" />
            <CardContent>
              <ReportsRouterView />
            </CardContent>
          </Card>
        ) : route === 'profile' ? (
          <Card>
            <CardHeader title="Аналитика" />
            <CardContent>
              <ProfileRouterView />
            </CardContent>
          </Card>
        ) : route === 'scraper' ? (
          <Card>
            <CardHeader title="Источники" />
            <CardContent>
              <ScraperRouterView />
            </CardContent>
          </Card>
        ) : (
          <AnalyticsPanel />
        )}
      </Container>
    </ThemeProvider>
  );
}
