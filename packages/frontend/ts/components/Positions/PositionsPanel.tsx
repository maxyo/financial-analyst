import React from 'react';
import { Grid, Card, CardContent, Typography, Chip, Table, TableBody, TableRow, TableCell } from '@mui/material';
import type { Position, Summary } from '../../types';
import { fmt, fmtInt, numColor } from '../../helpers';

interface Props {
  positions: Position[];
  summary: Summary | null;
}

export function PositionsPanel({ positions, summary }: Props) {
  if (!positions || positions.length === 0) {
    return (
      <Typography color="text.secondary">Нет открытых позиций</Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {positions.map((p, i) => {
        const t = p.ticker || p.figi || p.instrumentId || '-';
        const name = p.name || '-';
        const qty = p.quantity != null ? fmtInt(p.quantity) : '-';
        const avg = p.averagePrice != null ? fmt(p.averagePrice, 6) : '-';
        const last = p.lastPrice != null ? fmt(p.lastPrice, 6) : '-';
        const effLot = Number(p.effectiveLot || p.lot || 0);
        const isFutures = (p.instrumentType || '').toLowerCase().includes('future');
        const units =
          p.positionUnits != null
            ? fmtInt(p.positionUnits)
            : effLot && p.quantity != null
              ? fmtInt(Number(p.quantity) * effLot)
              : null;
        const notional =
          p.notional != null && isFinite(Number(p.notional))
            ? fmt(Number(p.notional), 2)
            : null;

        const rows: [string, any, string?][] = [];
        rows.push(['Тикер', t]);
        rows.push(['Название', name]);
        rows.push(['Кол-во (контракты/шт.)', qty]);
        if (isFutures && effLot) {
          const ul = p.underlyingLot != null ? fmtInt(p.underlyingLot) : '-';
          const fl = p.futuresLot != null ? fmtInt(p.futuresLot) : '-';
          rows.push(['Эффективный лот', `${ul} × ${fl} = ${fmtInt(effLot)}`]);
        } else if (effLot) {
          rows.push(['Лот', fmtInt(effLot)]);
        }
        if (units) rows.push(['Размер позиции (ед.)', units]);
        rows.push(['Средняя', avg]);
        rows.push(['Текущая', last]);
        if (notional) rows.push(['Notional', notional]);

        let fundingRow: [string, string, string] | null = null;
        try {
          const st = summary && summary.ticker ? String(summary.ticker).toUpperCase() : null;
          const pt = t ? String(t).toUpperCase() : null;
          const fpu = summary && summary.fundingPerUnit != null ? Number(summary.fundingPerUnit) : null;
          if (st && pt && st === pt && fpu != null) {
            const posUnits =
              p.positionUnits != null
                ? Number(p.positionUnits)
                : effLot && p.quantity != null
                  ? Number(p.quantity) * effLot
                  : null;
            if (posUnits != null && isFinite(posUnits)) {
              const cashFlow = -fpu * Number(posUnits);
              if (isFinite(cashFlow)) {
                fundingRow = ['Ожидаемый фандинг по позиции', `${fmt(cashFlow, 2)}`, ''];
              }
            }
          }
        } catch {}

        return (
          <Grid item xs={12} md={6} lg={4} key={i}>
            <Card>
              <CardContent>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  {name} <Chip label={t} size="small" sx={{ ml: 1 }} />
                </Typography>
                <Table size="small">
                  <TableBody>
                    {rows.map(([k, v], idx) => (
                      <TableRow key={idx}>
                        <TableCell>{k}</TableCell>
                        <TableCell align="right">{v}</TableCell>
                      </TableRow>
                    ))}
                    {fundingRow && (
                      <TableRow>
                        <TableCell>{fundingRow[0]}</TableCell>
                        <TableCell align="right" sx={{ color: numColor(fundingRow[1]) }}>
                          {fundingRow[1]}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
