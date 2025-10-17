"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
var react_1 = require("react");
var material_1 = require("@mui/material");
function Header(_a) {
    var ticker = _a.ticker, status = _a.status, onTickerChange = _a.onTickerChange, onLoad = _a.onLoad;
    return (<material_1.AppBar position="static" color="default" enableColorOnDark>
      <material_1.Toolbar sx={{ gap: 2 }}>
        <material_1.Typography variant="h6" sx={{ flexGrow: 1 }}>
          Панель инструментов
        </material_1.Typography>
        <material_1.TextField id="ticker" label="Тикер" size="small" value={ticker} onChange={function (e) { return onTickerChange(e.target.value); }} placeholder="например, CNYRUBF"/>
        <material_1.Button variant="contained" onClick={onLoad}>
          Загрузить
        </material_1.Button>
        <material_1.Typography variant="body2" color="text.secondary">
          {status}
        </material_1.Typography>
      </material_1.Toolbar>
    </material_1.AppBar>);
}
