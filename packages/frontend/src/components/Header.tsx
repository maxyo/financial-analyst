import React from 'react';
import { AppBar, Toolbar, Typography, TextField, Button, Tabs, Tab } from '@mui/material';

interface Props {
  ticker: string;
  status?: string;
  activeRoute: 'instrument' | 'jobs' | 'analytics' | 'sources';
  onNavigate: (route: 'instrument' | 'jobs' | 'analytics' | 'sources') => void;
  onTickerChange: (value: string) => void;
  onLoad: () => void;
}

export function Header({ ticker, status, activeRoute, onNavigate, onTickerChange, onLoad }: Props) {
  return (
    <AppBar position="static" color="default" enableColorOnDark>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ mr: 2 }}>
          Панель инструментов
        </Typography>
        <Tabs
          value={activeRoute}
          onChange={(_e, v) => onNavigate(v)}
          sx={{ mr: 2 }}
        >
          <Tab label="инструмент" value="instrument" />
          <Tab label="задачи" value="jobs" />
          <Tab label="Аналитика" value="analytics" />
          <Tab label="данные" value="sources" />
        </Tabs>
        {activeRoute === 'instrument' && (
          <>
            <TextField
              id="ticker"
              label="Тикер"
              size="small"
              value={ticker}
              onChange={(e) => onTickerChange(e.target.value)}
              placeholder="например, CNYRUBF"
            />
            <Button variant="contained" onClick={onLoad}>
              Загрузить
            </Button>
          </>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {status}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
