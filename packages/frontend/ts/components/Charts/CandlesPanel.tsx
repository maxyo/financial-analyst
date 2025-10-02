import React from 'react';
import { Card, CardHeader, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import type { CandlePoint, Trade, Clearing } from '../../types';
import type { Scale } from '../../helpers';
import { AnyChartStock } from './Chart';

interface Props {
  scale: Scale;
  onScaleChange: (scale: Scale) => void;
  candles?: CandlePoint[];
  trades?: Trade[];
  clearings?: Clearing[];
}

export function CandlesPanel({ scale, onScaleChange, candles, trades, clearings }: Props) {
  return (
    <Card>
      <CardHeader
        title={`Свечи (${scale}, сегодня)`}
        action={
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="scale-label">Масштаб</InputLabel>
            <Select
              labelId="scale-label"
              id="scale"
              label="Масштаб"
              value={scale}
              onChange={(e) => onScaleChange(e.target.value as Scale)}
            >
              <MenuItem value="1m">1m</MenuItem>
              <MenuItem value="5m">5m</MenuItem>
              <MenuItem value="15m">15m</MenuItem>
              <MenuItem value="1h">1h</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <CardContent>
        <AnyChartStock candles={candles} trades={trades} clearings={clearings} />
      </CardContent>
    </Card>
  );
}
