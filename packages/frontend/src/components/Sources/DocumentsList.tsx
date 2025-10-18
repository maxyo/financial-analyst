import React from 'react';
import { List, ListItem, ListItemText, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Box, TextField, MenuItem, Select, InputLabel, FormControl, Stack } from '@mui/material';
import { DocumentsService, DocumentsListResponseDto, DocumentDto, ScrapersService, ScrapersListResponseDto } from '../../api/client';

export function DocumentsList() {
  const useState = React.useState;
  const useEffect = React.useEffect;

  const [docs, setDocs] = useState<DocumentsListResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [titleFilter, setTitleFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');
  const [scraperId, setScraperId] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [scrapers, setScrapers] = useState<ScrapersListResponseDto | null>(null);
  const [scrapersLoading, setScrapersLoading] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<DocumentDto | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    try {
      const data = await DocumentsService.documentsControllerList(
        limit,
        offset,
        titleFilter.trim() || undefined,
        textFilter.trim() || undefined,
        scraperId || undefined,
        dateFrom ? new Date(dateFrom).toISOString() : undefined,
        dateTo ? new Date(dateTo).toISOString() : undefined,
      );
      setDocs(data);
    } catch (e: any) {
      console.error(e);
      setError('Не удалось загрузить список документов');
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(id: string) {
    setSelectedId(id);
    setDetailsOpen(true);
    setDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const data = await DocumentsService.documentsControllerGetOne(id);
      setDetails(data);
    } catch (e: any) {
      console.error(e);
      setDetailsError('Не удалось загрузить детали документа');
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setDetailsOpen(false);
    setSelectedId(null);
    setDetails(null);
    setDetailsError(null);
    setDetailsLoading(false);
  }

  useEffect(() => {
    // load scrapers once
    (async () => {
      try {
        setScrapersLoading(true);
        const list = await ScrapersService.scrapersControllerList(200, 0);
        setScrapers(list);
      } catch (e) {
        // ignore scraper load errors; dropdown will be empty
        console.warn('Failed to load scrapers', e);
      } finally {
        setScrapersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  if (loading) return <Typography variant="body2">Загрузка...</Typography>;
  if (error) return (
    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
      {error}
    </Typography>
  );

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <TextField size="small" label="Название" value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)} />
          <TextField size="small" label="Поиск в тексте" value={textFilter} onChange={(e) => setTextFilter(e.target.value)} />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="scraper-select-label">Скрапер</InputLabel>
            <Select
              labelId="scraper-select-label"
              label="Скрапер"
              value={scraperId}
              onChange={(e) => setScraperId(String(e.target.value))}
            >
              <MenuItem value=""><em>Все</em></MenuItem>
              {scrapers?.items?.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name || s.id}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField size="small" label="От" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="До" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />

          <Button variant="contained" size="small" onClick={() => { setOffset(0); loadDocuments(); }} disabled={loading || scrapersLoading}>
            Применить
          </Button>
        </Stack>
      </Box>

      <List dense>
        {docs?.items?.length ? (
          docs.items.map((d) => (
            <ListItem key={d.id} divider secondaryAction={
              <Button size="small" variant="outlined" onClick={() => openDetails(d.id)}>Подробнее</Button>
            }>
              <ListItemText
                primary={d.title}
                secondary={`Скрапер: ${d.scraper?.name ?? d.scraper?.id ?? '—'} • Извлечено: ${new Date(d.scrapedAt).toLocaleString()}`}
              />
            </ListItem>
          ))
        ) : (
          <Typography variant="body2">Документы отсутствуют</Typography>
        )}
      </List>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Box>
          <Typography variant="caption">
            {docs ? `Показано ${docs.items.length} из ${docs.total}` : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="На странице"
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
            sx={{ width: 120 }}
          >
            {[10,20,50,100].map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </TextField>
          <Button
            size="small"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0 || loading}
          >Назад</Button>
          <Button
            size="small"
            onClick={() => setOffset(offset + limit)}
            disabled={!docs || offset + limit >= docs.total || loading}
          >Вперёд</Button>
        </Box>
      </Box>

      <Dialog open={detailsOpen} onClose={closeDetails} fullWidth maxWidth="md">
        <DialogTitle>Детали документа</DialogTitle>
        <DialogContent dividers>
          {detailsLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Загрузка...</Typography>
            </Box>
          )}
          {detailsError && (
            <Typography variant="body2" color="error">{detailsError}</Typography>
          )}
          {details && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle1">{details.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Скрапер: {details.scraper?.name ?? details.scraper?.id ?? '—'} • Извлечено: {new Date(details.scrapedAt).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">Хэш содержимого: {details.contentHash}</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Текст документа</Typography>
                <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'background.default', p: 1, borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                  {details.content}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
