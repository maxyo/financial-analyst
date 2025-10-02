import React from 'react';
import { Card, CardHeader, CardContent, Table, TableBody, TableRow, TableCell, Chip } from '@mui/material';
import type { SummaryLite } from '../../types';
import { fmt, numColor } from '../../helpers';

interface Props {
  underlying: SummaryLite;
}

export function UnderlyingSummary({ underlying }: Props) {
  return (
    <Card>
      <CardHeader title="Базовый актив" />
      <CardContent>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Тикер</TableCell>
              <TableCell align="right">
                <Chip label={underlying.ticker || '-'} size="small" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell align="right">{underlying.name || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Last</TableCell>
              <TableCell align="right" sx={{ color: numColor(underlying.lastPrice) }}>
                {fmt(underlying.lastPrice, 6)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>VWAP (сегодня)</TableCell>
              <TableCell align="right">{fmt(underlying.vwap, 6)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
