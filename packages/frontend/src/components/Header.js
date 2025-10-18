"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
var react_1 = require("react");
var material_1 = require("@mui/material");
function Header(_a) {
    var ticker = _a.ticker, status = _a.status, activeRoute = _a.activeRoute, onNavigate = _a.onNavigate, onTickerChange = _a.onTickerChange, onLoad = _a.onLoad;
    // Map nested routes to their parent tab to avoid MUI Tabs value mismatch
    var tabsValue = activeRoute === 'profile' || activeRoute === 'reports' ? 'analytics' : activeRoute;
    return (<material_1.AppBar position="static" color="default" enableColorOnDark>
      <material_1.Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
        <material_1.Typography variant="h6" sx={{ mr: 2 }}>
          Панель инструментов
        </material_1.Typography>
        <material_1.Tabs value={tabsValue} onChange={function (_e, v) { return onNavigate(v); }} sx={{ mr: 2 }}>
          <material_1.Tab label="задачи" value="jobs"/>
          <material_1.Tab label="Аналитика" value="analytics"/>
          <material_1.Tab label="данные" value="sources"/>
        </material_1.Tabs>
        {activeRoute === 'instrument' && (<>
            <material_1.TextField id="ticker" label="Тикер" size="small" value={ticker} onChange={function (e) { return onTickerChange(e.target.value); }} placeholder="например, CNYRUBF"/>
            <material_1.Button variant="contained" onClick={onLoad}>
              Загрузить
            </material_1.Button>
          </>)}
        <material_1.Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {status}
        </material_1.Typography>
      </material_1.Toolbar>
    </material_1.AppBar>);
}
