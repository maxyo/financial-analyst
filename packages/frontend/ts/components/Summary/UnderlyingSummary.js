"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnderlyingSummary = UnderlyingSummary;
var react_1 = require("react");
var material_1 = require("@mui/material");
var helpers_1 = require("../../helpers");
function UnderlyingSummary(_a) {
    var underlying = _a.underlying;
    return (<material_1.Card>
      <material_1.CardHeader title="Базовый актив"/>
      <material_1.CardContent>
        <material_1.Table size="small">
          <material_1.TableBody>
            <material_1.TableRow>
              <material_1.TableCell>Тикер</material_1.TableCell>
              <material_1.TableCell align="right">
                <material_1.Chip label={underlying.ticker || '-'} size="small"/>
              </material_1.TableCell>
            </material_1.TableRow>
            <material_1.TableRow>
              <material_1.TableCell>Название</material_1.TableCell>
              <material_1.TableCell align="right">{underlying.name || '-'}</material_1.TableCell>
            </material_1.TableRow>
            <material_1.TableRow>
              <material_1.TableCell>Last</material_1.TableCell>
              <material_1.TableCell align="right" sx={{ color: (0, helpers_1.numColor)(underlying.lastPrice) }}>
                {(0, helpers_1.fmt)(underlying.lastPrice, 6)}
              </material_1.TableCell>
            </material_1.TableRow>
            <material_1.TableRow>
              <material_1.TableCell>VWAP (сегодня)</material_1.TableCell>
              <material_1.TableCell align="right">{(0, helpers_1.fmt)(underlying.vwap, 6)}</material_1.TableCell>
            </material_1.TableRow>
          </material_1.TableBody>
        </material_1.Table>
      </material_1.CardContent>
    </material_1.Card>);
}
