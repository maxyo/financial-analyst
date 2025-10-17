"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourcesPanel = SourcesPanel;
var react_1 = require("react");
var material_1 = require("@mui/material");
var DocumentsList_1 = require("./DocumentsList");
var ScrapersList_1 = require("./ScrapersList");
function SourcesPanel() {
    var useState = react_1.default.useState;
    var _a = useState('documents'), subTab = _a[0], setSubTab = _a[1];
    return (<material_1.Card>
      <material_1.CardHeader title="Данные"/>
      <material_1.CardContent>
        <material_1.Tabs value={subTab} onChange={function (_e, v) { return setSubTab(v); }} sx={{ mb: 2 }}>
          <material_1.Tab label="документы" value="documents"/>
          <material_1.Tab label="сборщики" value="scrapers"/>
        </material_1.Tabs>

        {subTab === 'scrapers' ? <ScrapersList_1.ScrapersList /> : <DocumentsList_1.DocumentsList />}
      </material_1.CardContent>
    </material_1.Card>);
}
