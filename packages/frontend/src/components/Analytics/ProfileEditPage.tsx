import React from 'react';
import { Box, Button, TextField, Typography, IconButton, List, ListItem, ListItemText, Divider } from '@mui/material';
import { ArrowBack, Save, Delete, Article, PlayArrow } from '@mui/icons-material';
import { ProfilesService, DocumentsService, TasksService } from '../../api/client';
import { TaskSelect } from '../Tasks/TaskSelectModal';
import type { TaskDto, ProfileTaskDto } from '../../api/client';
import type { ProfileDto, ProfileUpdateDto, ProfileCreateDto, DocumentSourcesListResponseDto, DocumentSourceDto, DocumentDto } from '../../api/client';
import { DocumentSelect } from '../Sources/DocumentSelectModal';

export function ProfileEditPage({ id, onBack }: { id?: number; onBack: () => void }) {
  const useState = React.useState;
  const useEffect = React.useEffect;

  const isNew = !id || id <= 0;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // Document sources editing state (visible only for existing profiles)
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [sources, setSources] = useState<DocumentSourcesListResponseDto | null>(null);
  const [docsMap, setDocsMap] = useState<Record<string, DocumentDto>>({});
  const [newDoc, setNewDoc] = useState<DocumentDto | null>(null);
  // Task selection state
  const [taskAssigning, setTaskAssigning] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<TaskDto | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [currentTask, setCurrentTask] = useState<TaskDto | null>(null);

  async function load() {
    if (isNew || !id) return;
    setLoading(true);
    setError(null);
    try {
      const p = await ProfilesService.profileControllerGetOne(String(id));
      setProfile(p);
      setName(p.name || '');
      setDescription(p.description ? (typeof p.description === 'string' ? p.description : JSON.stringify(p.description)) : '');
      await loadSources(String(id));
      await loadTask(String(id));
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadSources(profileId: string) {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const data = await ProfilesService.profileControllerListSources(profileId);
      setSources(data);
      const items = Array.isArray(data?.items) ? data.items : [];
      // fetch details for missing docs
      const missing = items.filter((s) => !docsMap[s.documentId]);
      if (missing.length) {
        const fetched = await Promise.allSettled(
          missing.map((s) => DocumentsService.documentsControllerGetOne(s.documentId))
        );
        const toMerge: Record<string, DocumentDto> = {};
        fetched.forEach((r) => {
          if (r.status === 'fulfilled') {
            const d = r.value as DocumentDto;
            if (d && (d as any).id) toMerge[d.id] = d;
          }
        });
        if (Object.keys(toMerge).length) {
          setDocsMap((prev) => ({ ...prev, ...toMerge }));
        }
      }
    } catch (e) {
      console.error(e);
      setDocsError('Не удалось загрузить документы профиля');
    } finally {
      setDocsLoading(false);
    }
  }

  async function assignDoc() {
    if (!id || !newDoc) return;
    try {
      await ProfilesService.profileControllerAssignSource(String(id), { documentId: newDoc.id } as any);
      setNewDoc(null);
      await loadSources(String(id));
    } catch (e) {
      console.error(e);
      setDocsError('Не удалось добавить документ');
    }
  }

  async function unassignDoc(documentId: string) {
    if (!id) return;
    try {
      await ProfilesService.profileControllerUnassignSource(String(id), documentId);
      await loadSources(String(id));
    } catch (e) {
      console.error(e);
      setDocsError('Не удалось удалить документ из профиля');
    }
  }

  function openReports() {
    if (!id) return;
    const nameParam = encodeURIComponent(name || profile?.name || '');
    window.location.hash = `#/reports/${id}?name=${nameParam}`;
  }

  async function runProfile() {
    if (!id) return;
    if (!confirm('Запустить анализ профиля?')) return;
    setRunError(null);
    setRunning(true);
    try {
      await ProfilesService.profileControllerRunAggregate(String(id));
    } catch (e) {
      console.error(e);
      setRunError('Не удалось запустить анализ');
    } finally {
      setRunning(false);
    }
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const payload: ProfileCreateDto = { name, description: description.trim() ? description : null as any };
        await ProfilesService.profileControllerCreate(payload);
      } else {
        const payload: ProfileUpdateDto = { name, description: description.trim() ? description : null as any };
        await ProfilesService.profileControllerUpdate(String(id), payload);
      }
      onBack();
    } catch (e) {
      console.error(e);
      setError('Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  }

  async function loadTask(profileId: string) {
      try {
        const t = await ProfilesService.profileControllerGetTask(profileId);
        setCurrentTaskId(t?.taskId ?? null);
        if (t?.taskId != null) {
          try {
            const full = await TasksService.tasksControllerGetOne(String(t.taskId));
            setCurrentTask(full);
          } catch (e) {
            console.warn('Не удалось загрузить детали таска', e);
            setCurrentTask(null);
          }
        } else {
          setCurrentTask(null);
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function assignTask() {
    if (!id || !newTask) return;
    setTaskError(null);
    setTaskAssigning(true);
    try {
      await ProfilesService.profileControllerAssignTask(String(id), { taskId: newTask.id } as any);
      setNewTask(null);
      await loadTask(String(id));
    } catch (e) {
      console.error(e);
      setTaskError('Не удалось назначить таск');
    } finally {
      setTaskAssigning(false);
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} onClick={onBack}>Назад</Button>
        <Typography variant="h6">{isNew ? 'Создать профиль' : `Редактировать профиль${profile ? `: ${profile.name}` : ''}`}</Typography>
      </Box>

      {loading && <Typography variant="body2">Загрузка...</Typography>}
      {error && <Typography variant="body2" color="error">{error}</Typography>}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 640 }}>
        <TextField label="Название" value={name} onChange={(e) => setName(e.target.value)} fullWidth autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!saving && name.trim()) save(); } }} helperText="Ctrl/Cmd+Enter — сохранить" />
        <TextField label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={6} />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<Save />} onClick={save} disabled={saving || !name.trim()}>Сохранить</Button>
          {!isNew && (
            <>
              <Button variant="outlined" startIcon={<Article />} onClick={openReports}>Репорты</Button>
              <Button variant="outlined" color="success" startIcon={<PlayArrow />} onClick={runProfile} disabled={running} title="Запустить анализ">{running ? 'Запуск...' : 'Запустить'}</Button>
            </>
          )}
        </Box>
        {!isNew && runError && <Typography variant="body2" color="error">{runError}</Typography>}
      </Box>

      {!isNew && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Таск профиля</Typography>
          {/* Current task display */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 640, mb: 1 }}>
            {currentTaskId ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                <Box>
                  <Typography variant="subtitle2">Назначен таск</Typography>
                  <Typography variant="body2">{currentTask?.name ?? `ID: ${currentTaskId}`}</Typography>
                  {currentTask?.updated_at && (
                    <Typography variant="caption" color="text.secondary">Обновлен: {new Date(currentTask.updated_at).toLocaleString()}</Typography>
                  )}
                </Box>
                <Button variant="text" color="error" onClick={async () => { if (!id) return; try { await ProfilesService.profileControllerUnassignTask(String(id)); setCurrentTaskId(null); setCurrentTask(null); } catch (e) { console.error(e); setTaskError('Не удалось убрать таск'); } }}>Убрать</Button>
              </Box>
            ) : (
              <Typography variant="body2">Таск не назначен</Typography>
            )}
          </Box>
          {/* Selection */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', maxWidth: 640, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <TaskSelect value={newTask} onChange={setNewTask} label="Выбрать таск" currentTask={currentTask} />
            </Box>
            <Button variant="contained" onClick={assignTask} disabled={!newTask || taskAssigning}>{taskAssigning ? 'Назначение...' : 'Назначить'}</Button>
          </Box>
          {taskError && <Typography variant="body2" color="error">{taskError}</Typography>}

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>Документы профиля</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', maxWidth: 640, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <DocumentSelect value={newDoc} onChange={setNewDoc} label="Добавить документ" />
            </Box>
            <Button variant="contained" onClick={assignDoc} disabled={!newDoc}>Добавить</Button>
          </Box>
          {docsLoading && <Typography variant="body2">Загрузка...</Typography>}
          {docsError && <Typography variant="body2" color="error">{docsError}</Typography>}
          <List dense sx={{ maxWidth: 800 }}>
            {sources?.items?.length ? sources.items.map((s: DocumentSourceDto) => {
              const d = docsMap[s.documentId];
              return (
                <ListItem key={s.id} divider secondaryAction={
                  <IconButton edge="end" aria-label="remove" onClick={() => unassignDoc(s.documentId)} title="Убрать">
                    <Delete />
                  </IconButton>
                }>
                  <ListItemText
                    primary={d ? (d.title || d.id) : `Документ ${s.documentId}`}
                    secondary={d ? `Скрапер: ${d.scraper?.name ?? d.scraper?.id ?? '—'} • Извлечено: ${new Date(d.scrapedAt).toLocaleString()}` : 'Загрузка деталей...'}
                  />
                </ListItem>
              );
            }) : (
              !docsLoading && <Typography variant="body2">Документы не выбраны</Typography>
            )}
          </List>
        </>
      )}
    </Box>
  );
}
