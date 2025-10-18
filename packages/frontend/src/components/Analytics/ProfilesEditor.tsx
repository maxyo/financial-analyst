import React from 'react';
import { Box, Button, IconButton, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { ProfilesService, ProfilesListResponseDto, ProfileDto } from '../../api/client';

export function ProfilesEditor() {
  const useState = React.useState;
  const useEffect = React.useEffect;

  const [list, setList] = useState<ProfilesListResponseDto | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified: separate edit page; list page only navigates to edit and delete

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await ProfilesService.profileControllerList();
      setList(data);
    } catch (e) {
      console.error(e);
      setError('Не удалось загрузить список профилей');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  async function remove(id: number) {
    if (!confirm('Удалить профиль?')) return;
    try {
      await ProfilesService.profileControllerRemove(String(id));
      await load();
    } catch (e) {
      console.error(e);
      setError('Не удалось удалить профиль');
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { window.location.hash = '#/profile/new'; }}>Добавить профиль</Button>
        <TextField size="small" placeholder="Поиск по названию" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 240 }} />
        {loading && <Typography variant="body2">Загрузка...</Typography>}
        {error && <Typography variant="body2" color="error">{error}</Typography>}
      </Box>

      <List dense>
        {list?.items?.length ? (
          list.items.filter((p) => !filter.trim() || (p.name || '').toLowerCase().includes(filter.toLowerCase())).map((p) => (
            <ListItem key={p.id} divider button onClick={() => { window.location.hash = `#/profile/${p.id}`; }} secondaryAction={
              <Box>
                <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); remove(p.id); }} title="Удалить"><Delete /></IconButton>
              </Box>
            }>
              <ListItemText primary={p.name} secondary={`${p.description ? (typeof p.description === 'string' ? p.description : JSON.stringify(p.description)) + ' • ' : ''}ID: ${p.id} • Обновлен: ${new Date(p.updated_at).toLocaleString()}`} />
            </ListItem>
          ))
        ) : (
          !loading && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Профили отсутствуют</Typography>
              <Button variant="outlined" startIcon={<Add />} onClick={() => { window.location.hash = '#/profile/new'; }}>Создать первый профиль</Button>
            </Box>
          )
        )}
      </List>
    </Box>
  );
}
