import React from 'react';
import { Box, Button, Card, CardContent, CardHeader, Divider, Grid, List, ListItem, ListItemButton, ListItemText, Stack, TextField, Typography, CircularProgress } from '@mui/material';
import { API_URL, fetchJSON } from '../../helpers';

// Minimal frontend types for AI feature
interface AnalysisProfileSource {
  id?: number;
  source_id: number;
  filters_json?: any;
}

interface AnalysisProfile {
  id?: number;
  name: string;
  description?: string;
  instrument_ticker?: string;
  sources?: AnalysisProfileSource[];
}

interface Job<T=any> {
  id: string;
  type: string;
  status: 'queued'|'running'|'succeeded'|'failed'|'canceled';
  payload?: T;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportContent {
  summary_bullets?: string[];
  signals?: { label: string; strength: 'strong'|'medium'|'weak'; rationale: string }[];
  risks?: string[];
  sentiment?: { label: 'bullish'|'bearish'|'neutral'; score: number };
  confidence?: number;
  outlook?: string;
  support?: { url: string; quote: string; published_at?: string }[];
  [k: string]: any;
}

interface ReportRow {
  id: number;
  profile_id: number;
  instrument_key?: string;
  content_json: ReportContent;
  created_at: string;
}

async function postJSON<T=any>(url: string, body: any): Promise<T> {
  const full = `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  const res = await fetch(full, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

function tryParseJSON(text: string): any {
  try { return JSON.parse(text); } catch { return undefined; }
}

export function AnalyticsPanel({ defaultInstrument }: { defaultInstrument?: string }) {
  const useState = React.useState;
  const useEffect = React.useEffect;

  const [profiles, setProfiles] = useState<AnalysisProfile[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [editing, setEditing] = useState<AnalysisProfile | null>(null);

  const [sourcesText, setSourcesText] = useState<string>('[]');
  const [sourcesError, setSourcesError] = useState<string>('');

  // Live validate sources JSON
  useEffect(() => {
    if (!sourcesText?.trim()) { setSourcesError(''); return; }
    try {
      const parsed = JSON.parse(sourcesText);
      if (!Array.isArray(parsed)) {
        setSourcesError('Ожидается массив объектов');
      } else {
        setSourcesError('');
      }
    } catch (e: any) {
      setSourcesError('Некорректный JSON');
    }
  }, [sourcesText]);

  const [runs, setRuns] = useState<Job[]>([]);
  const [selectedRunReport, setSelectedRunReport] = useState<ReportRow | null>(null);

  const [runForm, setRunForm] = useState<{ instrumentKey: string; windowStart?: string; windowEnd?: string; maxDocs?: number }>({ instrumentKey: defaultInstrument || '' });
  const [status, setStatus] = useState<string>('');

  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(false);
  const [loadingRuns, setLoadingRuns] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [profilesCollapsed, setProfilesCollapsed] = useState<boolean>(() => (typeof localStorage !== 'undefined' && localStorage.getItem('ai.profilesCollapsed') === '1'));

  async function loadProfiles() {
    setLoadingProfiles(true);
    try {
      const data = await fetchJSON<{ items: AnalysisProfile[] }>(`/api/ai/profiles`);
      setProfiles(data.items || []);
      // if selected exists, fetch detailed with sources
      if (selectedId) {
        try {
          const det = await fetchJSON<AnalysisProfile>(`/api/ai/profiles/${selectedId}`);
          setEditing(det);
          setSourcesText(JSON.stringify(det.sources ?? [], null, 2));
        } catch {}
      }
    } finally {
      setLoadingProfiles(false);
    }
  }

  async function loadRuns() {
    setLoadingRuns(true);
    try {
      const data = await fetchJSON<{ jobs: Job[] }>(`/api/ai/runs`);
      setRuns(Array.isArray(data.jobs) ? data.jobs : []);
    } finally {
      setLoadingRuns(false);
    }
  }

  useEffect(() => {
    loadProfiles().catch(console.error);
    loadRuns().catch(console.error);
    const t = setInterval(() => {
      loadRuns().catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchJSON<AnalysisProfile>(`/api/ai/profiles/${selectedId}`).then((p) => {
      setEditing(p);
      setSourcesText(JSON.stringify(p.sources ?? [], null, 2));
      setRunForm((prev) => ({ ...prev, instrumentKey: p.instrument_ticker || prev.instrumentKey }));
    }).catch(console.error);
  }, [selectedId]);

  const onNewProfile = () => {
    const p: AnalysisProfile = { name: 'Новый профиль', description: '', instrument_ticker: defaultInstrument || '', sources: [] };
    setEditing(p);
    setSelectedId(undefined);
    setSourcesText('[]');
  };

  const onSaveProfile = async () => {
    if (!editing || sourcesError) return;
    setSaving(true);
    setStatus('Сохранение профиля...');
    try {
      const body: any = { id: editing.id, name: editing.name, description: editing.description, instrument_ticker: editing.instrument_ticker };
      const parsed = tryParseJSON(sourcesText);
      if (parsed && Array.isArray(parsed)) {
        body.sources = parsed.map((s: any) => ({ source_id: Number(s.source_id ?? s.sourceId), filters_json: s.filters_json ?? s.filters }));
      }
      const saved = await postJSON<AnalysisProfile>(`/api/ai/profiles`, body);
      setEditing(saved);
      setSelectedId(saved.id);
      await loadProfiles();
      setStatus('');
    } catch (e: any) {
      console.error(e);
      setStatus(`Ошибка: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const onRunAnalysis = async () => {
    if (!editing?.id) { setStatus('Сначала сохраните профиль'); return; }
    setRunning(true);
    setStatus('Запуск анализа...');
    try {
      const payload: any = {
        profileId: editing.id,
        instrumentKey: runForm.instrumentKey || editing.instrument_ticker,
      };
      if (runForm.windowStart || runForm.windowEnd) payload.window = { start: runForm.windowStart ?? null, end: runForm.windowEnd ?? null };
      if (runForm.maxDocs) payload.maxDocs = runForm.maxDocs;
      await postJSON(`/api/ai/analyze`, payload);
      await loadRuns();
      setStatus('Запущено');
      setTimeout(() => setStatus(''), 1500);
    } catch (e: any) {
      console.error(e);
      setStatus(`Ошибка запуска: ${e?.message || e}`);
    } finally {
      setRunning(false);
    }
  };

  const onOpenReport = async (reportId: number) => {
    try {
      const rep = await fetchJSON<ReportRow>(`/api/ai/report/${reportId}`);
      setSelectedRunReport(rep);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader
            title="Профили анализа"
            action={<Button variant="contained" onClick={onNewProfile}>Новый</Button>}
          />
          <CardContent>
            {loadingProfiles ? (
              <CircularProgress size={20} />
            ) : profiles.length ? (
              <List dense>
                {profiles.map((p) => (
                  <ListItem key={p.id} disablePadding>
                    <ListItemButton selected={selectedId === p.id} onClick={() => setSelectedId(p.id)}>
                      <ListItemText primary={p.name} secondary={p.instrument_ticker || ''} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">Нет профилей</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Редактор профиля" />
          <CardContent>
            {editing ? (
              <Stack spacing={2}>
                <TextField label="Название" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} fullWidth />
                <TextField label="Тикер инструмента" value={editing.instrument_ticker || ''} onChange={(e) => setEditing({ ...editing, instrument_ticker: e.target.value })} fullWidth />
                <TextField label="Описание" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} multiline rows={2} fullWidth />
                <Typography variant="subtitle2">{"Источники (JSON массив объектов { \"source_id\", \"filters_json\" })"}</Typography>
                <TextField value={sourcesText} onChange={(e) => setSourcesText(e.target.value)} multiline rows={8} fullWidth error={!!sourcesError} helperText={sourcesError || ' ' } />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button variant="contained" onClick={onSaveProfile} disabled={!!sourcesError || saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  {saving && <CircularProgress size={18} />}
                  <Typography variant="body2" color="text.secondary">{status}</Typography>
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Выберите профиль или создайте новый</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Запуск анализа" />
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField label="Инструмент" value={runForm.instrumentKey} onChange={(e) => setRunForm({ ...runForm, instrumentKey: e.target.value })} size="small" />
              <TextField label="Начало окна (ISO)" value={runForm.windowStart || ''} onChange={(e) => setRunForm({ ...runForm, windowStart: e.target.value })} size="small" sx={{ minWidth: 220 }} />
              <TextField label="Конец окна (ISO)" value={runForm.windowEnd || ''} onChange={(e) => setRunForm({ ...runForm, windowEnd: e.target.value })} size="small" sx={{ minWidth: 220 }} />
              <TextField label="Макс. док-тов" type="number" value={runForm.maxDocs || ''} onChange={(e) => setRunForm({ ...runForm, maxDocs: Number(e.target.value) || undefined })} size="small" sx={{ width: 140 }} />
              <Button variant="contained" onClick={onRunAnalysis} disabled={!editing?.id || running}>
                {running ? 'Запуск...' : 'Запустить'}
              </Button>
              {running && <CircularProgress size={18} />}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Запуски (последние)" />
          <CardContent>
            {loadingRuns ? (
              <CircularProgress size={20} />
            ) : runs.length ? (
              <List dense>
                {runs.map((j) => {
                  const rid = (j.result && (j.result as any).reportId) as number | undefined;
                  return (
                    <ListItem key={j.id} secondaryAction={rid ? <Button size="small" onClick={() => onOpenReport(rid)}>Отчет #{rid}</Button> : undefined}>
                      <ListItemText
                        primary={`${j.status.toUpperCase()} • ${new Date(j.createdAt).toLocaleString('ru-RU')}`}
                        secondary={j.error ? `Ошибка: ${j.error}` : j.type}
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">Нет запусков</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title={selectedRunReport ? `Отчет #${selectedRunReport.id}` : 'Отчет'} />
          <CardContent>
            {selectedRunReport ? (
              <Box>
                <Typography variant="subtitle1">Инструмент: {selectedRunReport.instrument_key || ''}</Typography>
                <Typography variant="body2" color="text.secondary">Создан: {new Date(selectedRunReport.created_at).toLocaleString('ru-RU')}</Typography>
                <Divider sx={{ my: 1 }} />
                {(selectedRunReport.content_json?.summary_bullets || []).map((b, idx) => (
                  <Typography key={idx} variant="body2">• {b}</Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Выберите запуск с готовым отчетом</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
