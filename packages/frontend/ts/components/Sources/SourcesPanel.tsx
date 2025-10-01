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
  TextField,
  Checkbox,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';

interface DataSourceRecord {
  id: number;
  name: string;
  source_type: string;
  config: any;
  created_at: string;
  update_strategy: any;
  is_active: 0 | 1;
}

function tryParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text; // fallback to raw string
  }
}

export function SourcesPanel() {
  const [rows, setRows] = React.useState<DataSourceRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJSON<{ sources: DataSourceRecord[] }>(
        '/api/data-sources',
      );
      setRows(Array.isArray(data?.sources) ? data.sources : []);
    } catch (e: any) {
      console.error(e);
      setError('Не удалось загрузить список источников');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  async function putJSON(url: string, body: any) {
    const res = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    return res.json();
  }

  const updateField = (
    id: number,
    key: keyof DataSourceRecord,
    value: any,
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, [key]: value } as any) : r)),
    );
  };

  const saveRow = async (r: DataSourceRecord) => {
    setError(null);
    setInfo(null);
    try {
      const payload: any = {
        name: r.name,
        source_type: r.source_type,
        is_active: r.is_active === 1 ? true : false,
      };
      // Allow JSON object or string; try to parse textareas if they are strings
      payload.config = typeof r.config === 'string' ? tryParseJson(r.config) : r.config;
      payload.update_strategy =
        typeof r.update_strategy === 'string'
          ? tryParseJson(r.update_strategy)
          : r.update_strategy;
      await putJSON(`/api/data-sources/${r.id}`, payload);
      setInfo('Сохранено');
      await load();
    } catch (e: any) {
      console.error(e);
      setError('Ошибка сохранения');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Источники"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            {loading && <CircularProgress size={18} />}
            <Button variant="outlined" onClick={load} disabled={loading}>
              Обновить
            </Button>
          </Stack>
        }
      />
      <CardContent>
        {error && (
          <Typography color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}
        {info && (
          <Typography color="success.main" sx={{ mb: 1 }}>
            {info}
          </Typography>
        )}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Активен</TableCell>
                <TableCell>Стратегия обновления (JSON)</TableCell>
                <TableCell>Конфиг (JSON)</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.id}</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      value={r.name || ''}
                      onChange={(e) => updateField(r.id, 'name', e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <TextField
                      value={r.source_type || ''}
                      onChange={(e) =>
                        updateField(r.id, 'source_type', e.target.value)
                      }
                      size="small"
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={r.is_active === 1}
                      onChange={(e) =>
                        updateField(r.id, 'is_active', e.target.checked ? 1 : 0)
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 260 }}>
                    <TextField
                      value={
                        typeof r.update_strategy === 'string'
                          ? r.update_strategy
                          : JSON.stringify(r.update_strategy ?? {}, null, 2)
                      }
                      onChange={(e) =>
                        updateField(r.id, 'update_strategy', e.target.value)
                      }
                      size="small"
                      fullWidth
                      multiline
                      minRows={3}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 260 }}>
                    <TextField
                      value={
                        typeof r.config === 'string'
                          ? r.config
                          : JSON.stringify(r.config ?? {}, null, 2)
                      }
                      onChange={(e) => updateField(r.id, 'config', e.target.value)}
                      size="small"
                      fullWidth
                      multiline
                      minRows={3}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => saveRow(r)}
                        disabled={loading}
                      >
                        Сохранить
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary">
                      Нет данных
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
