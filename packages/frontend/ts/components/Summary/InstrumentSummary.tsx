import React from 'react';
import { Card, CardHeader, CardContent, Typography, Chip, Table, TableBody, TableRow, TableCell } from '@mui/material';
import type { Summary } from '../../types';
import { fmt, fmtPct, numColor } from '../../helpers';

interface Props {
  summary: Summary | null;
}

export function InstrumentSummary({ summary }: Props) {
  return (
    <Card>
      <CardHeader title="Инструмент" />
      <CardContent>
        {summary ? (
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Тикер</TableCell>
                <TableCell align="right">
                  <Chip label={summary.ticker || '-'} size="small" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell align="right">{summary.name || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Last</TableCell>
                <TableCell align="right" sx={{ color: numColor(summary.lastPrice) }}>
                  {fmt(summary.lastPrice, 6)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bid</TableCell>
                <TableCell align="right">{fmt(summary.bestBid, 6)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ask</TableCell>
                <TableCell align="right">{fmt(summary.bestAsk, 6)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Спред</TableCell>
                <TableCell align="right">{fmt(summary.spread, 6)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>VWAP (сегодня)</TableCell>
                <TableCell align="right">{fmt(summary.vwap, 6)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Премия</TableCell>
                <TableCell align="right" sx={{ color: numColor(summary.premium) }}>
                  {fmtPct(summary.premium, 4)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Оценка фандинга</TableCell>
                <TableCell align="right" sx={{ color: numColor(summary.fundingRateEst) }}>
                  {fmtPct(summary.fundingRateEst, 4)}
                </TableCell>
              </TableRow>
              {summary.fundingPerUnit != null && (
                <TableRow>
                  <TableCell>Фандинг/ед.</TableCell>
                  <TableCell align="right" sx={{ color: numColor(summary.fundingPerUnit) }}>
                    {fmt(summary.fundingPerUnit, 6)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <Typography color="text.secondary">Нет данных</Typography>
        )}
      </CardContent>
    </Card>
  );
}
