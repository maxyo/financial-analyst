"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
var react_1 = require("react");
var material_1 = require("@mui/material");
function Header(_a) {
    var activeRoute = _a.activeRoute, onNavigate = _a.onNavigate;
    var tabsValue = activeRoute === 'profile' || activeRoute === 'reports'
        ? 'analytics'
        : activeRoute === 'scraper'
            ? 'sources'
            : activeRoute;
    return (<material_1.AppBar position="static" color="default" enableColorOnDark>
      <material_1.Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
        <material_1.Typography variant="h6" sx={{ mr: 2 }}>
          Панель инструментов
        </material_1.Typography>
        <material_1.Tabs value={tabsValue} onChange={function (_e, v) { return onNavigate(v); }} sx={{ mr: 2 }}>
          <material_1.Tab label="Аналитика" value="analytics"/>
          <material_1.Tab label="данные" value="sources"/>
        </material_1.Tabs>
      </material_1.Toolbar>
    </material_1.AppBar>);
}
