import React from 'react';
import { AppBar, Toolbar, Typography, TextField, Button, Tabs, Tab } from '@mui/material';

interface Props {
  ticker: string;
  status?: string;
  activeRoute: 'instrument' | 'jobs' | 'analytics' | 'sources' | 'reports' | 'profile';
  onNavigate: (route: 'instrument' | 'jobs' | 'analytics' | 'sources' | 'reports' | 'profile') => void;
  onTickerChange: (value: string) => void;
  onLoad: () => void;
}

export function Header({ ticker, status, activeRoute, onNavigate, onTickerChange, onLoad }: Props) {
  // Map nested routes to their parent tab to avoid MUI Tabs value mismatch
  const tabsValue: 'jobs' | 'analytics' | 'sources' =
    activeRoute === 'profile' || activeRoute === 'reports' ? 'analytics' : activeRoute;

  return (
    <AppBar position="static" color="default" enableColorOnDark>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ mr: 2 }}>
          Панель инструментов
        </Typography>
        <Tabs
          value={tabsValue}
          onChange={(_e, v) => onNavigate(v)}
          sx={{ mr: 2 }}
        >
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
