import React from 'react';
import { AppBar, Tab, Tabs, Toolbar, Typography } from '@mui/material';

interface Props {
  activeRoute:
    | 'jobs'
    | 'analytics'
    | 'sources'
    | 'reports'
    | 'profile'
    | 'scraper';
  onNavigate: (route: 'jobs' | 'analytics' | 'sources') => void;
}

export function Header({ activeRoute, onNavigate }: Props) {
  // Map nested routes to their parent tab to avoid MUI Tabs value mismatch
  const tabsValue: 'jobs' | 'analytics' | 'sources' =
    activeRoute === 'profile' || activeRoute === 'reports'
      ? 'analytics'
      : activeRoute === 'scraper'
        ? 'sources'
        : activeRoute;

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
      </Toolbar>
    </AppBar>
  );
}
