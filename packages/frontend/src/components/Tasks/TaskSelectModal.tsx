import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItemButton, ListItemText, CircularProgress, Box, Typography, IconButton, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import { TasksService } from '../../api/client';
import type { TaskDto, TasksListResponseDto, TaskCreateDto, TaskUpdateDto } from '../../api/client';

async function apiGetTasks(limit = 50, offset = 0): Promise<TasksListResponseDto> {
  return TasksService.tasksControllerList(limit, offset);
}

async function apiCreateTask(payload: TaskCreateDto): Promise<TaskDto> {
  return TasksService.tasksControllerCreate(payload);
}

export type TaskSelectModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (task: TaskDto) => void;
  title?: string;
  currentTask?: TaskDto | null; // если передан, позволяем редактировать
};

export function TaskSelectModal(props: TaskSelectModalProps) {
  const { open, onClose, onSelect, title, currentTask } = props;
  const useState = React.useState;
  const useEffect = React.useEffect;

  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<TasksListResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create or edit task state
  const [mode, setMode] = useState<'create' | 'edit'>(currentTask ? 'edit' : 'create');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newName, setNewName] = useState(currentTask?.name ?? '');
  const [newDescription, setNewDescription] = useState(currentTask?.description ?? '');
  const [newPrompt, setNewPrompt] = useState(currentTask?.prompt ?? '');

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetTasks(50, 0);
      setTasks(data);
    } catch (e: any) {
      console.error(e);
      setError('Не удалось загрузить таски');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadTasks();
      // sync form with currentTask when opened
      setMode(currentTask ? 'edit' : 'create');
      setNewName(currentTask?.name ?? '');
      setNewDescription(currentTask?.description ?? '');
      setNewPrompt(currentTask?.prompt ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!tasks?.items) return [] as TaskDto[];
    const q = query.trim().toLowerCase();
    if (!q) return tasks.items;
    return tasks.items.filter((t) =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    );
  }, [tasks, query]);

  async function handleCreateOrUpdate() {
    if (!newName.trim() || !newPrompt.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      if (mode === 'edit' && currentTask) {
        const updated = await TasksService.tasksControllerUpdate(String(currentTask.id), {
          name: newName.trim(),
          description: newDescription.trim() ? newDescription : null,
          prompt: newPrompt,
        } as TaskUpdateDto);
        onSelect(updated);
      } else {
        const created = await apiCreateTask({ name: newName.trim(), description: newDescription.trim() ? newDescription : null, prompt: newPrompt });
        onSelect(created);
        setNewName('');
        setNewDescription('');
        setNewPrompt('');
      }
    } catch (e: any) {
      console.error(e);
      setCreateError(mode === 'edit' ? 'Не удалось обновить таск' : 'Не удалось создать таск');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" keepMounted>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title ?? 'Выбор таска'}</span>
        <IconButton size="small" onClick={onClose} aria-label="Закрыть">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Search and list */}
        <Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <SearchIcon color="action" />
            <TextField
              fullWidth
              size="small"
              placeholder="Поиск по названию или описанию..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Box>
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Загрузка...</Typography>
            </Box>
          )}
          {error && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>
          )}
          {!loading && !error && (
            <List dense sx={{ maxHeight: 300, overflowY: 'auto', mt: 1 }}>
              {filtered.length ? (
                filtered.map((t) => (
                  <ListItemButton key={t.id} onClick={() => onSelect(t)}>
                    <ListItemText
                      primary={t.name}
                      secondary={(t.description ? `${t.description} • ` : '') + `ID: ${t.id} • Обновлен: ${new Date(t.updated_at).toLocaleString()}`}
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
        </Box>

        <Divider />

        {/* Create or edit task */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1">{mode === 'edit' ? 'Редактировать текущий таск' : 'Создать новый таск'}</Typography>
            {currentTask && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant={mode === 'edit' ? 'contained' : 'outlined'} onClick={() => setMode('edit')}>Редактировать</Button>
                <Button size="small" variant={mode === 'create' ? 'contained' : 'outlined'} onClick={() => setMode('create')}>Создать</Button>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField label="Название" size="small" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <TextField label="Описание (необязательно)" size="small" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            <TextField label="Промпт" size="small" multiline minRows={4} value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} />
            {createError && <Typography variant="body2" color="error">{createError}</Typography>}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleCreateOrUpdate} disabled={creating || !newName.trim() || !newPrompt.trim()}>{mode === 'edit' ? 'Сохранить изменения' : 'Создать и выбрать'}</Button>
              <Button variant="text" onClick={() => { setNewName(currentTask?.name ?? ''); setNewDescription(currentTask?.description ?? ''); setNewPrompt(currentTask?.prompt ?? ''); }} disabled={creating}>Сбросить</Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
      </DialogActions>
    </Dialog>
  );
}

export function TaskSelect({ value, onChange, label, currentTask }: { value?: TaskDto | null; onChange: (task: TaskDto | null) => void; label?: string; currentTask?: TaskDto | null; }) {
  const useState = React.useState;
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <TextField
        fullWidth
        label={label ?? 'Таск'}
        value={value?.name || ''}
        placeholder="Выбрать таск"
        InputProps={{ readOnly: true }}
        onClick={() => setOpen(true)}
        sx={{ '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input::placeholder': { opacity: 1 } }}
      />
      <TaskSelectModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(task) => { onChange(task); setOpen(false); }}
        currentTask={currentTask || null}
      />
    </Box>
  );
}
