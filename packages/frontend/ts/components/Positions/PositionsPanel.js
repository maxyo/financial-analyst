"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionsPanel = PositionsPanel;
var react_1 = require("react");
var material_1 = require("@mui/material");
var helpers_1 = require("../../helpers");
function PositionsPanel(_a) {
    var positions = _a.positions, summary = _a.summary;
    if (!positions || positions.length === 0) {
        return (<material_1.Typography color="text.secondary">Нет открытых позиций</material_1.Typography>);
    }
    return (<material_1.Grid container spacing={2}>
      {positions.map(function (p, i) {
            var t = p.ticker || p.figi || p.instrumentId || '-';
            var name = p.name || '-';
            var qty = p.quantity != null ? (0, helpers_1.fmtInt)(p.quantity) : '-';
            var avg = p.averagePrice != null ? (0, helpers_1.fmt)(p.averagePrice, 6) : '-';
            var last = p.lastPrice != null ? (0, helpers_1.fmt)(p.lastPrice, 6) : '-';
            var effLot = Number(p.effectiveLot || p.lot || 0);
            var isFutures = (p.instrumentType || '').toLowerCase().includes('future');
            var units = p.positionUnits != null
                ? (0, helpers_1.fmtInt)(p.positionUnits)
                : effLot && p.quantity != null
                    ? (0, helpers_1.fmtInt)(Number(p.quantity) * effLot)
                    : null;
            var notional = p.notional != null && isFinite(Number(p.notional))
                ? (0, helpers_1.fmt)(Number(p.notional), 2)
                : null;
            var rows = [];
            rows.push(['Тикер', t]);
            rows.push(['Название', name]);
            rows.push(['Кол-во (контракты/шт.)', qty]);
            if (isFutures && effLot) {
                var ul = p.underlyingLot != null ? (0, helpers_1.fmtInt)(p.underlyingLot) : '-';
                var fl = p.futuresLot != null ? (0, helpers_1.fmtInt)(p.futuresLot) : '-';
                rows.push(['Эффективный лот', "".concat(ul, " \u00D7 ").concat(fl, " = ").concat((0, helpers_1.fmtInt)(effLot))]);
            }
            else if (effLot) {
                rows.push(['Лот', (0, helpers_1.fmtInt)(effLot)]);
            }
            if (units)
                rows.push(['Размер позиции (ед.)', units]);
            rows.push(['Средняя', avg]);
            rows.push(['Текущая', last]);
            if (notional)
                rows.push(['Notional', notional]);
            var fundingRow = null;
            try {
                var st = summary && summary.ticker ? String(summary.ticker).toUpperCase() : null;
                var pt = t ? String(t).toUpperCase() : null;
                var fpu = summary && summary.fundingPerUnit != null ? Number(summary.fundingPerUnit) : null;
                if (st && pt && st === pt && fpu != null) {
                    var posUnits = p.positionUnits != null
                        ? Number(p.positionUnits)
                        : effLot && p.quantity != null
                            ? Number(p.quantity) * effLot
                            : null;
                    if (posUnits != null && isFinite(posUnits)) {
                        var cashFlow = -fpu * Number(posUnits);
                        if (isFinite(cashFlow)) {
                            fundingRow = ['Ожидаемый фандинг по позиции', "".concat((0, helpers_1.fmt)(cashFlow, 2)), ''];
                        }
                    }
                }
            }
            catch (_a) { }
            return (<material_1.Grid item xs={12} md={6} lg={4} key={i}>
            <material_1.Card>
              <material_1.CardContent>
                <material_1.Typography sx={{ fontWeight: 600, mb: 1 }}>
                  {name} <material_1.Chip label={t} size="small" sx={{ ml: 1 }}/>
                </material_1.Typography>
                <material_1.Table size="small">
                  <material_1.TableBody>
                    {rows.map(function (_a, idx) {
                    var k = _a[0], v = _a[1];
                    return (<material_1.TableRow key={idx}>
                        <material_1.TableCell>{k}</material_1.TableCell>
                        <material_1.TableCell align="right">{v}</material_1.TableCell>
                      </material_1.TableRow>);
                })}
                    {fundingRow && (<material_1.TableRow>
                        <material_1.TableCell>{fundingRow[0]}</material_1.TableCell>
                        <material_1.TableCell align="right" sx={{ color: (0, helpers_1.numColor)(fundingRow[1]) }}>
                          {fundingRow[1]}
                        </material_1.TableCell>
                      </material_1.TableRow>)}
                  </material_1.TableBody>
                </material_1.Table>
              </material_1.CardContent>
            </material_1.Card>
          </material_1.Grid>);
        })}
    </material_1.Grid>);
}
