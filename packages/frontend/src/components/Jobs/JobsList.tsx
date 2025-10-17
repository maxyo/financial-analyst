import React from 'react';
import { API_URL, fetchJSON } from '../../helpers';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tabs,
  Tab,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

interface JobRow {
  id: string | number;
  type?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  runAt?: string;
  startedAt?: string;
  finishedAt?: string;
  attempts?: number;
  maxAttempts?: number;
  priority?: number;
}

interface JobDetails extends JobRow {
  payload?: any;
  result?: any;
  error?: string;
}

export function JobsList() {
  const [jobs, setJobs] = React.useState<JobRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<'list' | 'actions'>('list');

  // Details modal state
  const [selectedId, setSelectedId] = React.useState<string | number | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [details, setDetails] = React.useState<JobDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJSON<{ jobs: JobRow[] }>('/api/jobs?limit=50');
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (e: any) {
      console.error(e);
      setError('Не удалось загрузить список задач');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (id: string | number) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const data = await fetchJSON<{ job: JobDetails }>(`/api/jobs/${id}`);
      setDetails(data?.job ?? null);
    } catch (e: any) {
      console.error(e);
      setDetailsError('Не удалось загрузить детали задачи');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openDetails = async (id: string | number) => {
    setSelectedId(id);
    setDetailsOpen(true);
    setDetails(null);
    setDetailsError(null);
    await fetchDetails(id);
  };

  const postJSON = async (url: string, body: any) => {
    const res = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    return res.json();
  };

  async function runImportInstruments() {
    setError(null);
    setInfo(null);
    try {
      await postJSON('/api/jobs', {
        type: 'instruments.import.tinkoff',
        payload: {},
      });
      setInfo('Задача запуска импорта инструментов добавлена в очередь');
      // Reload list to show the new job
      await load();
      setTab('list');
    } catch (e: any) {
      console.error(e);
      setError('Не удалось запустить импорт инструментов');
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader
        title="Задачи"
        action={
          <Tabs
            value={tab}
            onChange={(_e, v) => setTab(v)}
            aria-label="jobs tabs"
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Список" value="list" />
            <Tab label="Действия" value="actions" />
          </Tabs>
        }
      />
      <CardContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {info && (
          <Typography sx={{ color: 'success.main', mb: 2 }}>{info}</Typography>
        )}
        {tab === 'list' ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Создано</TableCell>
                  <TableCell>След. запуск</TableCell>
                  <TableCell align="right">Попытки</TableCell>
                  <TableCell align="right">Приоритет</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id} hover>
                    <TableCell>{j.id}</TableCell>
                    <TableCell>{j.type || '-'}</TableCell>
                    <TableCell>{j.status || '-'}</TableCell>
                    <TableCell>
                      {j.createdAt
                        ? new Date(j.createdAt).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {j.nextRunAt
                        ? new Date(j.nextRunAt).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell align="right">{j.attempts ?? 0}</TableCell>
                    <TableCell align="right">{j.priority ?? '-'}</TableCell>
                    <TableCell align="right">
                      <Button onClick={() => openDetails(j.id)}>
                        Подробнее
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary">Нет задач</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Stack direction="column" spacing={2}>
            <Typography variant="subtitle1">
              Преднастройки запуска задач
            </Typography>
            <Button
              variant="contained"
              onClick={runImportInstruments}
              disabled={loading}
            >
              Запустить импорт инструментов
            </Button>
          </Stack>
        )}
      </CardContent>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {details
            ? `Задача ${details.id} — ${details.type}`
            : selectedId
              ? `Задача ${selectedId}`
              : 'Детали задачи'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {detailsLoading && (
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={20} />
              <Typography>Загрузка…</Typography>
            </Stack>
          )}
          {!detailsLoading && detailsError && (
            <Typography color="error">{detailsError}</Typography>
          )}
          {!detailsLoading && !detailsError && details && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Общее</Typography>
              <Typography variant="body2" color="text.secondary">
                Статус: <b>{details.status}</b>
                {' • '}Приоритет: <b>{details.priority ?? '-'}</b>
                {' • '}Попытки: <b>{details.attempts ?? 0}</b>
                {typeof details.maxAttempts === 'number'
                  ? ` / ${details.maxAttempts}`
                  : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Создано:{' '}
                {details.createdAt
                  ? new Date(details.createdAt).toLocaleString()
                  : '-'}
                {' • '}Плановый старт:{' '}
                {details.runAt ? new Date(details.runAt).toLocaleString() : '-'}
                {' • '}Старт:{' '}
                {details.startedAt
                  ? new Date(details.startedAt).toLocaleString()
                  : '-'}
                {' • '}Завершено:{' '}
                {details.finishedAt
                  ? new Date(details.finishedAt).toLocaleString()
                  : '-'}
                {' • '}Обновлено:{' '}
                {details.updatedAt
                  ? new Date(details.updatedAt).toLocaleString()
                  : '-'}
              </Typography>

              <div>
                <Typography variant="subtitle2" gutterBottom>
                  Параметры (payload)
                </Typography>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {details.payload != null
                    ? JSON.stringify(details.payload, null, 2)
                    : '—'}
                </pre>
              </div>

              <div>
                <Typography variant="subtitle2" gutterBottom>
                  Результат
                </Typography>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {details.result != null
                    ? JSON.stringify(details.result, null, 2)
                    : '—'}
                </pre>
              </div>

              {details.error && (
                <div>
                  <Typography variant="subtitle2" gutterBottom color="error">
                    Ошибка
                  </Typography>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#b00020',
                    }}
                  >
                    {details.error}
                  </pre>
                </div>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => selectedId != null && fetchDetails(selectedId)}
            disabled={detailsLoading}
          >
            Обновить
          </Button>
          <Button onClick={() => setDetailsOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default JobsList;
