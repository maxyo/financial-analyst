import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';
import { ProfilesEditor } from './ProfilesEditor';

export function AnalyticsPanel() {
  return (
    <Card>
      <CardHeader title="Аналитика" />
      <CardContent>
        <ProfilesEditor />
      </CardContent>
    </Card>
  );
}
