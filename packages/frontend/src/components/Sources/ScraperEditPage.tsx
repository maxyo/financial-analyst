import React from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import type { ScraperCreateDto, ScraperUpdateDto, ScraperDto_Output as ScraperDto } from '../../api/client';
import { ScrapersService } from '../../api/client';

// Edit page for Scraper, migrated from modal in ScrapersList
export function ScraperEditPage({
  id,
  onBack,
}: {
  id?: string;
  onBack: () => void;
}) {
  const useState = React.useState;
  const useEffect = React.useEffect;

  const isNew = !id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scraper, setScraper] = useState<ScraperDto | null>(null);

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
  });

  async function load() {
    if (isNew || !id) return;
    setLoading(true);
    setError(null);
    try {
      const s = await ScrapersService.scrapersControllerGetOne(id);
      setScraper(s);
      const raw = (s as any).data || (s as any) || {};
      const rawCfg = raw.config || {};
      const cfg =
        rawCfg && typeof rawCfg === 'object' && rawCfg[raw.type]
          ? rawCfg[raw.type]
          : rawCfg;
      const api: ApiConfigForm = {
        url: typeof cfg?.url === 'string' ? cfg.url : '',
      };
      const html: HtmlConfigForm = {
        url: typeof cfg?.url === 'string' ? cfg.url : '',
        selectors: Array.isArray(cfg?.selectors)
          ? cfg.selectors.filter(
              (x: any) =>
                x &&
                typeof x.name === 'string' &&
                typeof x.selector === 'string',
            )
          : [],
        headers:
          cfg?.headers && typeof cfg.headers === 'object' ? cfg.headers : {},
        timeoutMs: typeof cfg?.timeoutMs === 'number' ? cfg.timeoutMs : 10000,
        pagination:
          cfg?.pagination && typeof cfg.pagination === 'object'
            ? {
                nextSelector:
                  typeof cfg.pagination.nextSelector === 'string'
                    ? cfg.pagination.nextSelector
                    : undefined,
                nextUrlTemplate:
                  typeof cfg.pagination.nextUrlTemplate === 'string'
                    ? cfg.pagination.nextUrlTemplate
                    : undefined,
                pageParam:
                  typeof cfg.pagination.pageParam === 'string'
                    ? cfg.pagination.pageParam
                    : undefined,
                startPage:
                  typeof cfg.pagination.startPage === 'number'
                    ? cfg.pagination.startPage
                    : undefined,
                maxPages:
                  typeof cfg.pagination.maxPages === 'number'
                    ? cfg.pagination.maxPages
                    : undefined,
              }
            : undefined,
        document:
          cfg?.document && typeof cfg.document === 'object'
            ? {
                linkSelector:
                  typeof cfg.document.linkSelector === 'string'
                    ? cfg.document.linkSelector
                    : '',
                linkAttr:
                  typeof cfg.document.linkAttr === 'string'
                    ? cfg.document.linkAttr
                    : undefined,
                titleSelector:
                  typeof cfg.document.titleSelector === 'string'
                    ? cfg.document.titleSelector
                    : undefined,
                contentSelector:
                  typeof cfg.document.contentSelector === 'string'
                    ? cfg.document.contentSelector
                    : undefined,
                baseUrl:
                  typeof cfg.document.baseUrl === 'string'
                    ? cfg.document.baseUrl
                    : undefined,
                maxDocsPerPage:
                  typeof cfg.document.maxDocsPerPage === 'number'
                    ? cfg.document.maxDocsPerPage
                    : undefined,
              }
            : undefined,
      };
      const postProcessors = Array.isArray(s.postProcessors)
        ? s.postProcessors.map((pp: any) => ({
            type: 'TRIM_WHITESPACE',
            config: {
              collapseMultipleSpaces: !!pp?.config?.collapseMultipleSpaces,
              collapseNewlines: !!pp?.config?.collapseNewlines,
              trimEachLine: pp?.config?.trimEachLine !== false,
            },
          }))
        : [];
      setForm({
        name: (raw as any).name || '',
        type: (raw as any).type,
        api,
        html,
        postProcessors,
        showJson: false,
      });
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить сборщик');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [id]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      let config: Record<string, any> = {};
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
          ...(form.html.pagination ? { pagination: form.html.pagination } : {}),
          ...(form.html.document ? { document: form.html.document } : {}),
        };
      }
      const pp = (form.postProcessors || []).map((p) => ({
        type: p.type,
        config: { ...p.config },
      }));
      if (isNew) {
        const payload: ScraperCreateDto = {
          data: {
            name: form.name,
            type: form.type,
            config: config,
            postProcessors: pp,
          },
        } as any;
        await ScrapersService.scrapersControllerCreate(payload as any);
      } else {
        const payload: ScraperUpdateDto = {
          data: {
            name: form.name,
            type: form.type,
            config,
            postProcessors: pp,
          },
        } as any;
        await ScrapersService.scrapersControllerUpdate(id!, payload as any);
      }
      onBack();
    } catch (e) {
      console.error(e);
      setError('Не удалось сохранить сборщик');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Button startIcon={<ArrowBack />} onClick={onBack}>
          Назад
        </Button>
        <Typography variant="h6">
          {isNew
            ? 'Создать сборщика'
            : `Редактировать сборщика${scraper ? `: ${(scraper as any).data?.name || ''}` : ''}`}
        </Typography>
      </Box>

      {loading && <Typography variant="body2">Загрузка...</Typography>}
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}
      >
        <TextField
          label="Название"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          fullWidth
        />
        <TextField
          select
          label="Тип"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          fullWidth
        >
          <MenuItem value="API">API</MenuItem>
          <MenuItem value="HTML">HTML</MenuItem>
        </TextField>

        {form.type === 'API' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2">Настройки API</Typography>
            <TextField
              label="URL"
              value={form.api.url}
              onChange={(e) =>
                setForm({ ...form, api: { ...form.api, url: e.target.value } })
              }
              fullWidth
            />
          </Box>
        )}

        {form.type === 'HTML' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2">Настройки HTML</Typography>
            <TextField
              label="URL"
              value={form.html.url}
              onChange={(e) =>
                setForm({
                  ...form,
                  html: { ...form.html, url: e.target.value },
                })
              }
              fullWidth
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Селекторы
              </Typography>
              {form.html.selectors.map((sel, idx) => (
                <Box
                  key={idx}
                  sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}
                >
                  <TextField
                    size="small"
                    label="Имя"
                    value={sel.name}
                    onChange={(e) => {
                      const selectors = form.html.selectors.slice();
                      selectors[idx] = {
                        ...selectors[idx],
                        name: e.target.value,
                      };
                      setForm({ ...form, html: { ...form.html, selectors } });
                    }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Селектор"
                    value={sel.selector}
                    onChange={(e) => {
                      const selectors = form.html.selectors.slice();
                      selectors[idx] = {
                        ...selectors[idx],
                        selector: e.target.value,
                      };
                      setForm({ ...form, html: { ...form.html, selectors } });
                    }}
                    sx={{ flex: 2 }}
                  />
                  <Button
                    onClick={() => {
                      const selectors = form.html.selectors.slice();
                      selectors.splice(idx, 1);
                      setForm({ ...form, html: { ...form.html, selectors } });
                    }}
                  >
                    -
                  </Button>
                </Box>
              ))}
              <Button
                size="small"
                onClick={() =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      selectors: [
                        ...form.html.selectors,
                        { name: '', selector: '' },
                      ],
                    },
                  })
                }
              >
                Добавить селектор
              </Button>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Заголовки
              </Typography>
              {Object.entries(form.html.headers).map(([k, v], idx) => (
                <Box
                  key={idx}
                  sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}
                >
                  <TextField
                    size="small"
                    label="Ключ"
                    value={k}
                    onChange={(e) => {
                      const headers = { ...form.html.headers } as Record<
                        string,
                        string
                      >;
                      delete headers[k];
                      headers[e.target.value] = v;
                      setForm({ ...form, html: { ...form.html, headers } });
                    }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Значение"
                    value={String(v)}
                    onChange={(e) => {
                      const headers = { ...form.html.headers } as Record<
                        string,
                        string
                      >;
                      headers[k] = e.target.value;
                      setForm({ ...form, html: { ...form.html, headers } });
                    }}
                    sx={{ flex: 2 }}
                  />
                  <Button
                    onClick={() => {
                      const headers = { ...form.html.headers } as Record<
                        string,
                        string
                      >;
                      delete headers[k];
                      setForm({ ...form, html: { ...form.html, headers } });
                    }}
                  >
                    -
                  </Button>
                </Box>
              ))}
              <Button
                size="small"
                onClick={() => {
                  const headers = { ...form.html.headers } as Record<
                    string,
                    string
                  >;
                  let i = 1;
                  let key = `Header-${i}`;
                  while (headers[key] !== undefined) {
                    i++;
                    key = `Header-${i}`;
                  }
                  headers[key] = '';
                  setForm({ ...form, html: { ...form.html, headers } });
                }}
              >
                Добавить заголовок
              </Button>
            </Box>

            <TextField
              type="number"
              label="Таймаут, мс"
              value={form.html.timeoutMs}
              onChange={(e) =>
                setForm({
                  ...form,
                  html: {
                    ...form.html,
                    timeoutMs: Number(e.target.value) || 0,
                  },
                })
              }
              fullWidth
            />

            <Box>
              <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                Пагинация (опционально)
              </Typography>
              <TextField
                size="small"
                label="CSS селектор кнопки 'Далее'"
                value={form.html.pagination?.nextSelector || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      pagination: {
                        ...(form.html.pagination || {}),
                        nextSelector: e.target.value || undefined,
                      },
                    },
                  })
                }
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                label="Шаблон следующего URL"
                value={form.html.pagination?.nextUrlTemplate || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      pagination: {
                        ...(form.html.pagination || {}),
                        nextUrlTemplate: e.target.value || undefined,
                      },
                    },
                  })
                }
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                label="Имя параметра страницы"
                value={form.html.pagination?.pageParam || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      pagination: {
                        ...(form.html.pagination || {}),
                        pageParam: e.target.value || undefined,
                      },
                    },
                  })
                }
                fullWidth
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  type="number"
                  label="Начальная страница"
                  value={form.html.pagination?.startPage ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      html: {
                        ...form.html,
                        pagination: {
                          ...(form.html.pagination || {}),
                          startPage: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        },
                      },
                    })
                  }
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Макс. страниц"
                  value={form.html.pagination?.maxPages ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      html: {
                        ...form.html,
                        pagination: {
                          ...(form.html.pagination || {}),
                          maxPages: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        },
                      },
                    })
                  }
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                Документы (опционально)
              </Typography>
              <TextField
                size="small"
                label="Селектор ссылки на документ"
                value={form.html.document?.linkSelector || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      document: {
                        ...(form.html.document || {}),
                        linkSelector: e.target.value,
                      },
                    },
                  })
                }
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                label="Атрибут ссылки (по умолчанию href)"
                value={form.html.document?.linkAttr || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      document: {
                        ...(form.html.document || {}),
                        linkAttr: e.target.value || undefined,
                      },
                    },
                  })
                }
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                label="Селектор заголовка"
                value={form.html.document?.titleSelector || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      document: {
                        ...(form.html.document || {}),
                        titleSelector: e.target.value || undefined,
                      },
                    },
                  })
                }
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                label="Селектор контента"
                value={form.html.document?.contentSelector || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      document: {
                        ...(form.html.document || {}),
                        contentSelector: e.target.value || undefined,
                      },
                    },
                  })
                }
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                label="Базовый URL"
                value={form.html.document?.baseUrl || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      document: {
                        ...(form.html.document || {}),
                        baseUrl: e.target.value || undefined,
                      },
                    },
                  })
                }
                fullWidth
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                type="number"
                label="Макс. документов на страницу"
                value={form.html.document?.maxDocsPerPage ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    html: {
                      ...form.html,
                      document: {
                        ...(form.html.document || {}),
                        maxDocsPerPage: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    },
                  })
                }
                fullWidth
              />
            </Box>
          </Box>
        )}

        {/* Post-processors editor */}
        <Box component={Paper} variant="outlined" sx={{ p: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="body2">Постпроцессоры</Typography>
            <Button
              size="small"
              onClick={() =>
                setForm({
                  ...form,
                  postProcessors: [
                    ...(form.postProcessors || []),
                    {
                      type: 'TRIM_WHITESPACE',
                      config: {
                        collapseMultipleSpaces: true,
                        collapseNewlines: true,
                        trimEachLine: true,
                      },
                    },
                  ],
                })
              }
            >
              Добавить
            </Button>
          </Box>
          {form.postProcessors?.length ? (
            form.postProcessors.map((pp, idx) => (
              <Box
                key={idx}
                sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    label="Тип"
                    value={pp.type}
                    onChange={(e) => {
                      const list = form.postProcessors.slice();
                      list[idx] = { ...pp, type: e.target.value };
                      setForm({ ...form, postProcessors: list });
                    }}
                    sx={{ width: 220 }}
                  >
                    <MenuItem value="TRIM_WHITESPACE">TRIM_WHITESPACE</MenuItem>
                  </TextField>
                  <Button
                    size="small"
                    onClick={() => {
                      const list = form.postProcessors.slice();
                      list.splice(idx, 1);
                      setForm({ ...form, postProcessors: list });
                    }}
                  >
                    Удалить
                  </Button>
                </Box>
                {pp.type === 'TRIM_WHITESPACE' && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      size="small"
                      label="Схлопывать пробелы"
                      value={pp.config.collapseMultipleSpaces ? 'Да' : 'Нет'}
                      onChange={(e) => {
                        const list = form.postProcessors.slice();
                        list[idx] = {
                          ...pp,
                          config: {
                            ...pp.config,
                            collapseMultipleSpaces: e.target.value === 'Да',
                          },
                        };
                        setForm({ ...form, postProcessors: list });
                      }}
                      select
                      sx={{ width: 220 }}
                    >
                      <MenuItem value={'Да'}>Да</MenuItem>
                      <MenuItem value={'Нет'}>Нет</MenuItem>
                    </TextField>
                    <TextField
                      size="small"
                      label="Схлопывать пустые строки"
                      value={pp.config.collapseNewlines ? 'Да' : 'Нет'}
                      onChange={(e) => {
                        const list = form.postProcessors.slice();
                        list[idx] = {
                          ...pp,
                          config: {
                            ...pp.config,
                            collapseNewlines: e.target.value === 'Да',
                          },
                        };
                        setForm({ ...form, postProcessors: list });
                      }}
                      select
                      sx={{ width: 260 }}
                    >
                      <MenuItem value={'Да'}>Да</MenuItem>
                      <MenuItem value={'Нет'}>Нет</MenuItem>
                    </TextField>
                    <TextField
                      size="small"
                      label="Триммировать каждую строку"
                      value={pp.config.trimEachLine ? 'Да' : 'Нет'}
                      onChange={(e) => {
                        const list = form.postProcessors.slice();
                        list[idx] = {
                          ...pp,
                          config: {
                            ...pp.config,
                            trimEachLine: e.target.value === 'Да',
                          },
                        };
                        setForm({ ...form, postProcessors: list });
                      }}
                      select
                      sx={{ width: 280 }}
                    >
                      <MenuItem value={'Да'}>Да</MenuItem>
                      <MenuItem value={'Нет'}>Нет</MenuItem>
                    </TextField>
                  </Box>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Пока нет постпроцессоров
            </Typography>
          )}
        </Box>

        {/* JSON viewer (read-only) */}
        <Box component={Paper} variant="outlined" sx={{ p: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2">
              JSON конфиг (только просмотр)
            </Typography>
          </Box>
          <TextField
            label="Config (JSON)"
            value={JSON.stringify(
              form.type === 'API'
                ? { url: form.api.url }
                : {
                    url: form.html.url,
                    selectors: form.html.selectors,
                    headers: form.html.headers,
                    timeoutMs: form.html.timeoutMs,
                    ...(form.html.pagination
                      ? { pagination: form.html.pagination }
                      : {}),
                    ...(form.html.document
                      ? { document: form.html.document }
                      : {}),
                  },
              null,
              2,
            )}
            fullWidth
            multiline
            minRows={4}
            InputProps={{ readOnly: true }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={save}
            disabled={saving || !form.name.trim()}
          >
            Сохранить
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
