import React from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Typography,
} from '@mui/material';
import {
  ScraperCreateDto,
  ScraperDto,
  ScrapersListResponseDto,
  ScrapersService,
  ScraperUpdateDto,
} from '../../api/client';
import { AddCircle, Delete, Edit, PlayArrow } from '@mui/icons-material';

export function ScrapersList() {
  const useState = React.useState;
  const useEffect = React.useEffect;

  const [scrapers, setScrapers] = useState<ScrapersListResponseDto | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScraperDto | null>(null);
  type ApiConfigForm = { url: string };
  type HtmlSelector = { name: string; selector: string };
  type HtmlPagination = {
    nextSelector?: string;
    nextUrlTemplate?: string;
    pageParam?: string;
    startPage?: number;
    maxPages?: number;
  };
  type HtmlDocument = {
    linkSelector: string;
    linkAttr?: string;
    titleSelector?: string;
    contentSelector?: string;
    baseUrl?: string;
    maxDocsPerPage?: number;
  };
  type HtmlConfigForm = {
    url: string;
    selectors: HtmlSelector[];
    headers: Record<string, string>;
    timeoutMs: number;
    pagination?: HtmlPagination;
    document?: HtmlDocument;
  };
  type PostProcessor = {
    type: 'TRIM_WHITESPACE';
    config: {
      collapseMultipleSpaces?: boolean;
      collapseNewlines?: boolean;
      trimEachLine?: boolean;
    };
  };
  type FormState = {
    name: string;
    type: 'API' | 'HTML';
    api: ApiConfigForm;
    html: HtmlConfigForm;
    postProcessors: PostProcessor[];
    showJson?: boolean;
    jsonSnapshot?: string | null;
  };
  const [form, setForm] = useState<FormState>({
    name: '',
    type: 'API',
    api: { url: '' },
    html: {
      url: '',
      selectors: [],
      headers: {},
      timeoutMs: 10000,
      pagination: undefined,
      document: undefined,
    },
    postProcessors: [],
    showJson: false,
    jsonSnapshot: null,
  });
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string } | null>(
    null,
  );

  function openCreate() {
    // navigate to scraper creation page (by analogy with profiles)
    window.location.hash = '#/scraper/new';
  }
  function openEdit(s: ScraperDto) {
    // navigate to edit page
    window.location.hash = `#/scraper/${s.id}`;
  }
  function closeDialog() {
    setDialogOpen(false);
  }

  async function loadScrapers() {
    setLoading(true);
    setError(null);
    try {
      const data = await ScrapersService.scrapersControllerList();
      setScrapers(data);
    } catch (e: any) {
      console.error(e);
      setError('Не удалось загрузить список сборщиков');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let config: Record<string, any> = {};
      {
        // Build config from form fields; JSON view is read-only and not used for submission
        if (form.type === 'API') {
          if (!form.api.url.trim()) {
            setError('Укажите URL');
            setSaving(false);
            return;
          }
          config = { url: form.api.url };
        } else if (form.type === 'HTML') {
          if (!form.html.url.trim()) {
            setError('Укажите URL');
            setSaving(false);
            return;
          }
          config = {
            url: form.html.url,
            selectors: form.html.selectors,
            headers: form.html.headers,
            timeoutMs: form.html.timeoutMs,
            ...(form.html.pagination
              ? { pagination: form.html.pagination }
              : {}),
            ...(form.html.document ? { document: form.html.document } : {}),
          };
        }
      }
      if (editing) {
        const payload: ScraperUpdateDto = {
          name: form.name,
          type: form.type,
          config,
        };
        await ScrapersService.scrapersControllerUpdate(editing.id, payload);
      } else {
        const payload: ScraperCreateDto = {
          name: form.name,
          type: form.type,
          config: config,
        };
        await ScrapersService.scrapersControllerCreate(payload);
      }
      setDialogOpen(false);
      await loadScrapers();
    } catch (e: any) {
      console.error(e);
      setError('Не удалось сохранить сборщик');
    } finally {
      setSaving(false);
    }
  }

  async function handleRun(id: string) {
    try {
      setRunningId(id);
      const resp = await ScrapersService.scrapersControllerRun(id);
      setSnack({
        open: true,
        message:
          resp && resp.jobId
            ? `Запущено, jobId: ${resp.jobId}`
            : 'Задача поставлена в очередь',
      });
    } catch (e) {
      console.error(e);
      setError('Не удалось запустить сборщик');
    } finally {
      setRunningId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить сборщик?')) return;
    try {
      await ScrapersService.scrapersControllerRemove(id);
      await loadScrapers();
    } catch (e) {
      console.error(e);
      setError('Не удалось удалить сборщик');
    }
  }

  useEffect(() => {
    loadScrapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={openCreate}
        >
          Добавить сборщика
        </Button>
        {loading && <Typography variant="body2">Загрузка...</Typography>}
        {error && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}
      </Box>

      <List dense>
        {scrapers?.items?.length
          ? scrapers.items.map((s) => (
              <ListItem
                key={s.id}
                divider
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="run"
                      onClick={() => handleRun(s.id)}
                      disabled={runningId === s.id}
                      title="Запустить"
                    >
                      <PlayArrow />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => openEdit(s)}
                      title="Редактировать"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(s.id)}
                      title="Удалить"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText primary={s.name} secondary={`Тип: ${s.type}`} />
              </ListItem>
            ))
          : !loading && (
              <Typography variant="body2">Сборщики отсутствуют</Typography>
            )}
      </List>
      <Snackbar
        open={!!snack?.open}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        message={snack?.message || ''}
      />
    </Box>
  );
}
