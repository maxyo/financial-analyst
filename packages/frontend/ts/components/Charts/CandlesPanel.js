"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandlesPanel = CandlesPanel;
var react_1 = require("react");
var material_1 = require("@mui/material");
var chart_1 = require("../../chart");
function CandlesPanel(_a) {
    var scale = _a.scale, onScaleChange = _a.onScaleChange, candles = _a.candles, trades = _a.trades, clearings = _a.clearings;
    return (<material_1.Card>
      <material_1.CardHeader title={"\u0421\u0432\u0435\u0447\u0438 (".concat(scale, ", \u0441\u0435\u0433\u043E\u0434\u043D\u044F)")} action={<material_1.FormControl size="small" sx={{ minWidth: 120 }}>
            <material_1.InputLabel id="scale-label">Масштаб</material_1.InputLabel>
            <material_1.Select labelId="scale-label" id="scale" label="Масштаб" value={scale} onChange={function (e) { return onScaleChange(e.target.value); }}>
              <material_1.MenuItem value="1m">1m</material_1.MenuItem>
              <material_1.MenuItem value="5m">5m</material_1.MenuItem>
              <material_1.MenuItem value="15m">15m</material_1.MenuItem>
              <material_1.MenuItem value="1h">1h</material_1.MenuItem>
            </material_1.Select>
          </material_1.FormControl>}/>
      <material_1.CardContent>
        <chart_1.AnyChartStock candles={candles} trades={trades} clearings={clearings}/>
      </material_1.CardContent>
    </material_1.Card>);
}
