import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack, Delete, OpenInNew } from '@mui/icons-material';
import type { ReportDto_Output as ReportDto, ReportsListResponseDto_Output as ReportsListResponseDto } from '../../api/client';
import { ReportsService } from '../../api/client';

export function ReportsPage({
  profileId,
  profileName,
  onBack,
}: {
  profileId: number;
  profileName?: string;
  onBack: () => void;
}) {
  const useState = React.useState;
  const useEffect = React.useEffect;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportsListResponseDto | null>(null);
  const [selected, setSelected] = useState<ReportDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const resp = await ReportsService.reportControllerList(undefined, undefined, profileId);
      setData(resp);
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить репорты');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  function openReport(r: ReportDto) {
    setSelected(r);
    setModalOpen(true);
  }
  function closeReport() {
    setModalOpen(false);
    setSelected(null);
  }

  async function removeReport(id: string) {
    if (!confirm('Удалить репорт?')) return;
    try {
      setRemovingId(id);
      await ReportsService.reportControllerRemove(id);
      await load();
    } catch (e) {
      console.error(e);
      setError('Не удалось удалить репорт');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={onBack}>
          Назад
        </Button>
        <Typography variant="h6">
          Репорты профиля{profileName ? `: ${profileName}` : ''}
        </Typography>
      </Box>

      {loading && <Typography variant="body2">Загрузка...</Typography>}
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      <List dense>
        {data?.items?.length
          ? data.items.map((r) => (
              <ListItem
                key={r.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="open"
                      title="Открыть"
                      onClick={() => openReport(r)}
                    >
                      <OpenInNew />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      title="Удалить"
                      onClick={() => removeReport(r.id)}
                      disabled={removingId === r.id}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`${r.type || 'default'} • ${new Date(r.created_at).toLocaleString()}`}
                  secondary={
                    r.content
                      ? JSON.stringify(r.content).slice(0, 160) +
                        (JSON.stringify(r.content).length > 160 ? '…' : '')
                      : 'Нет содержимого'
                  }
                />
              </ListItem>
            ))
          : !loading && (
              <Typography variant="body2">Репорты отсутствуют</Typography>
            )}
      </List>

      <Dialog open={modalOpen} onClose={closeReport} fullWidth maxWidth="md">
        <DialogTitle>Репорт</DialogTitle>
        <DialogContent>
          {selected ? (
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 1, flexWrap: 'wrap' }}
              >
                <Chip label={selected.type || 'default'} size="small" />
                <Chip
                  label={new Date(selected.created_at).toLocaleString()}
                  size="small"
                />
                <Chip
                  label={`ID: ${selected.id}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`Profile: ${selected.profile_id}`}
                  size="small"
                  variant="outlined"
                />
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Содержимое
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      p: 1,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100',
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? theme.palette.grey[100]
                          : 'inherit',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: 12,
                    }}
                  >
                    {selected.content
                      ? JSON.stringify(selected.content, null, 2)
                      : 'Нет содержимого'}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Метаданные
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      rowGap: 0.5,
                      columnGap: 1,
                      alignItems: 'start',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Job
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#0b1220'
                            : 'grey.100',
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.grey[100]
                            : 'inherit',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {selected.job_id
                        ? JSON.stringify(selected.job_id, null, 2)
                        : '—'}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      LLM
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#0b1220'
                            : 'grey.100',
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.grey[100]
                            : 'inherit',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {selected.llmModel
                        ? JSON.stringify(selected.llmModel, null, 2)
                        : '—'}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Confidence
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#0b1220'
                            : 'grey.100',
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.grey[100]
                            : 'inherit',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {selected.confidence
                        ? JSON.stringify(selected.confidence, null, 2)
                        : '—'}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Relevance
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#0b1220'
                            : 'grey.100',
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.grey[100]
                            : 'inherit',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {selected.relevance
                        ? JSON.stringify(selected.relevance, null, 2)
                        : '—'}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Tokens in
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#0b1220'
                            : 'grey.100',
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.grey[100]
                            : 'inherit',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {selected.tokens_in
                        ? JSON.stringify(selected.tokens_in, null, 2)
                        : '—'}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Tokens out
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#0b1220'
                            : 'grey.100',
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.grey[100]
                            : 'inherit',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        whiteSpace: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {selected.tokens_out
                        ? JSON.stringify(selected.tokens_out, null, 2)
                        : '—'}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Стоимость
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? '#0b1220'
                            : 'grey.100',
                        color: (theme) =>
                          theme.palette.mode === 'dark'
                            ? theme.palette.grey[100]
                            : 'inherit',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      {selected.cost
                        ? JSON.stringify(selected.cost, null, 2)
                        : '—'}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReport}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
