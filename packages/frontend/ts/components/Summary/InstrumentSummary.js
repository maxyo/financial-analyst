"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrumentSummary = InstrumentSummary;
var react_1 = require("react");
var material_1 = require("@mui/material");
var helpers_1 = require("../../helpers");
function InstrumentSummary(_a) {
    var summary = _a.summary;
    return (<material_1.Card>
      <material_1.CardHeader title="Инструмент"/>
      <material_1.CardContent>
        {summary ? (<material_1.Table size="small">
            <material_1.TableBody>
              <material_1.TableRow>
                <material_1.TableCell>Тикер</material_1.TableCell>
                <material_1.TableCell align="right">
                  <material_1.Chip label={summary.ticker || '-'} size="small"/>
                </material_1.TableCell>
              </material_1.TableRow>
              <material_1.TableRow>
                <material_1.TableCell>Название</material_1.TableCell>
                <material_1.TableCell align="right">{summary.name || '-'}</material_1.TableCell>
              </material_1.TableRow>
              <material_1.TableRow>
                <material_1.TableCell>Last</material_1.TableCell>
                <material_1.TableCell align="right" sx={{ color: (0, helpers_1.numColor)(summary.lastPrice) }}>
                  {(0, helpers_1.fmt)(summary.lastPrice, 6)}
                </material_1.TableCell>
              </material_1.TableRow>
              <material_1.TableRow>
                <material_1.TableCell>Bid</material_1.TableCell>
                <material_1.TableCell align="right">{(0, helpers_1.fmt)(summary.bestBid, 6)}</material_1.TableCell>
              </material_1.TableRow>
              <material_1.TableRow>
                <material_1.TableCell>Ask</material_1.TableCell>
                <material_1.TableCell align="right">{(0, helpers_1.fmt)(summary.bestAsk, 6)}</material_1.TableCell>
              </material_1.TableRow>
              <material_1.TableRow>
                <material_1.TableCell>Спред</material_1.TableCell>
                <material_1.TableCell align="right">{(0, helpers_1.fmt)(summary.spread, 6)}</material_1.TableCell>
              </material_1.TableRow>
              <material_1.TableRow>
                <material_1.TableCell>VWAP (сегодня)</material_1.TableCell>
                <material_1.TableCell align="right">{(0, helpers_1.fmt)(summary.vwap, 6)}</material_1.TableCell>
              </material_1.TableRow>
              <material_1.TableRow>
                <material_1.TableCell>Премия</material_1.TableCell>
                <material_1.TableCell align="right" sx={{ color: (0, helpers_1.numColor)(summary.premium) }}>
                  {(0, helpers_1.fmtPct)(summary.premium, 4)}
                </material_1.TableCell>
              </material_1.TableRow>
              <material_1.TableRow>
                <material_1.TableCell>Оценка фандинга</material_1.TableCell>
                <material_1.TableCell align="right" sx={{ color: (0, helpers_1.numColor)(summary.fundingRateEst) }}>
                  {(0, helpers_1.fmtPct)(summary.fundingRateEst, 4)}
                </material_1.TableCell>
              </material_1.TableRow>
              {summary.fundingPerUnit != null && (<material_1.TableRow>
                  <material_1.TableCell>Фандинг/ед.</material_1.TableCell>
                  <material_1.TableCell align="right" sx={{ color: (0, helpers_1.numColor)(summary.fundingPerUnit) }}>
                    {(0, helpers_1.fmt)(summary.fundingPerUnit, 6)}
                  </material_1.TableCell>
                </material_1.TableRow>)}
            </material_1.TableBody>
          </material_1.Table>) : (<material_1.Typography color="text.secondary">Нет данных</material_1.Typography>)}
      </material_1.CardContent>
    </material_1.Card>);
}
