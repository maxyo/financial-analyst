import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItemButton, ListItemText, CircularProgress, Box, Typography, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { DocumentsService, DocumentsListResponseDto, DocumentDto } from '../../api/client';

export type DocumentSelectModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (doc: DocumentDto) => void;
  title?: string;
};

export function DocumentSelectModal(props: DocumentSelectModalProps) {
  const { open, onClose, onSelect, title } = props;
  const useState = React.useState;
  const useEffect = React.useEffect;

  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<DocumentsListResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    try {
      const data = await DocumentsService.documentsControllerList(50, 0);
      setDocs(data);
    } catch (e: any) {
      console.error(e);
      setError('Не удалось загрузить документы');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!docs?.items) return [] as DocumentDto[];
    const q = query.trim().toLowerCase();
    if (!q) return docs.items;
    return docs.items.filter((d) =>
      ((d.title || d.id || '').toLowerCase().includes(q)) ||
      ((d.scraper?.name || d.scraper?.id || '').toLowerCase().includes(q))
    );
  }, [docs, query]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" keepMounted>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title ?? 'Выбор документа'}</span>
        <IconButton size="small" onClick={onClose} aria-label="Закрыть">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <SearchIcon color="action" />
          <TextField
            fullWidth
            size="small"
            placeholder="Поиск по названию или скраперу..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Загрузка...</Typography>
          </Box>
        )}
        {error && (
          <Typography variant="body2" color="error">{error}</Typography>
        )}

        {!loading && !error && (
          <List dense sx={{ maxHeight: 420, overflowY: 'auto', mt: 1 }}>
            {filtered.length ? (
              filtered.map((d) => (
                <ListItemButton key={d.id} onClick={() => onSelect(d)}>
                  <ListItemText
                    primary={d.title || d.id}
                    secondary={`Скрапер: ${d.scraper?.name ?? d.scraper?.id ?? '—'} • ${new Date(d.scrapedAt).toLocaleString()}` }
                  />
                </ListItemButton>
              ))
            ) : (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2">Ничего не найдено</Typography>
              </Box>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
      </DialogActions>
    </Dialog>
  );
}

export function DocumentSelect({ value, onChange, label }: { value?: DocumentDto | null; onChange: (doc: DocumentDto | null) => void; label?: string; }) {
  const useState = React.useState;
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <TextField
        fullWidth
        label={label ?? 'Документ'}
        value={value?.title || ''}
        placeholder="Выбрать документ"
        InputProps={{ readOnly: true }}
        onClick={() => setOpen(true)}
        sx={{ '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input::placeholder': { opacity: 1 } }}
      />
      <DocumentSelectModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(doc) => { onChange(doc); setOpen(false); }}
      />
    </Box>
  );
}
