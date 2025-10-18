"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsPanel = AnalyticsPanel;
var react_1 = require("react");
var material_1 = require("@mui/material");
var ProfilesEditor_1 = require("./ProfilesEditor");
function AnalyticsPanel() {
    return (<material_1.Card>
      <material_1.CardHeader title="Аналитика"/>
      <material_1.CardContent>
        <ProfilesEditor_1.ProfilesEditor />
      </material_1.CardContent>
    </material_1.Card>);
}
