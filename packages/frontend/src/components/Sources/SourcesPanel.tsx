import React from 'react';
import { Card, CardContent, CardHeader, Tab, Tabs } from '@mui/material';
import { DocumentsList } from './DocumentsList';
import { ScrapersList } from './ScrapersList';

export function SourcesPanel() {
  const useState = React.useState;

  const [subTab, setSubTab] = useState<'documents' | 'scrapers'>('documents');

  return (
    <Card>
      <CardHeader title="Данные" />
      <CardContent>
        <Tabs value={subTab} onChange={(_e, v) => setSubTab(v)} sx={{ mb: 2 }}>
          <Tab label="документы" value="documents" />
          <Tab label="сборщики" value="scrapers" />
        </Tabs>

        {subTab === 'scrapers' ? <ScrapersList /> : <DocumentsList />}
      </CardContent>
    </Card>
  );
}
