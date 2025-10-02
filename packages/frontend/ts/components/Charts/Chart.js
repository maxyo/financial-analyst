"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyChartStock = AnyChartStock;
var react_1 = require("react");
var react_apexcharts_1 = require("react-apexcharts");
var helpers_1 = require("../../helpers");
// Replaces AnyChart implementation with React ApexCharts candlestick + annotations
function AnyChartStock(_a) {
    var candles = _a.candles, trades = _a.trades, clearings = _a.clearings;
    var pts = Array.isArray(candles) ? candles : [];
    // Filter out zero candles (o=h=l=c=0)
    var filteredPts = react_1.default.useMemo(function () {
        return pts.filter(function (c) {
            var o = Number(c.o);
            var h = Number(c.h);
            var l = Number(c.l);
            var cl = Number(c.c);
            if ([o, h, l, cl].some(function (v) { return !isFinite(v); }))
                return false;
            return !(o === 0 && h === 0 && l === 0 && cl === 0);
        });
    }, [pts]);
    // Build a quick lookup for candle by timestamp to place clearing markers near price
    var candleByTs = react_1.default.useMemo(function () {
        var map = new Map();
        for (var _i = 0, filteredPts_1 = filteredPts; _i < filteredPts_1.length; _i++) {
            var c = filteredPts_1[_i];
            var ms = new Date(c.t).getTime();
            if (isFinite(ms))
                map.set(ms, c);
        }
        return map;
    }, [filteredPts]);
    // Precompute visible bounds: prevent future panning, allow moving back to earliest data
    var _b = react_1.default.useMemo(function () {
        if (filteredPts.length === 0)
            return [undefined, Math.min(Date.now(), Date.now())];
        var xs = filteredPts
            .map(function (c) { return new Date(c.t).getTime(); })
            .filter(function (v) { return isFinite(v); })
            .sort(function (a, b) { return a - b; });
        var min = xs[0];
        var lastDataTs = xs[xs.length - 1];
        var now = Date.now();
        var max = Math.min(now, lastDataTs);
        return [min, max];
    }, [filteredPts]), minX = _b[0], maxX = _b[1];
    // Series for ApexCharts candlestick
    var series = react_1.default.useMemo(function () {
        var data = filteredPts
            .map(function (c) {
            var ms = new Date(c.t).getTime();
            if (!isFinite(ms))
                return null;
            var o = Number(c.o);
            var h = Number(c.h);
            var l = Number(c.l);
            var cl = Number(c.c);
            if ([o, h, l, cl].some(function (v) { return !isFinite(v); }))
                return null;
            if (o === 0 && h === 0 && l === 0 && cl === 0)
                return null; // additional safety
            return { x: ms, y: [o, h, l, cl] };
        })
            .filter(Boolean);
        return [{ name: 'Цена', data: data }];
    }, [filteredPts]);
    // Annotations for trades and clearings
    var annotations = react_1.default.useMemo(function () {
        var tradePoints = (Array.isArray(trades) ? trades : [])
            .map(function (t) {
            if (!t || !t.t || t.p == null)
                return null;
            var x = new Date(t.t).getTime();
            if (!isFinite(x))
                return null;
            var price = Number(t.p);
            if (!isFinite(price))
                return null;
            var qty = t.q != null ? Number(t.q) : null;
            var side = (t.side || '').toLowerCase();
            var isBuy = side === 'buy';
            var isSell = side === 'sell';
            var color = isBuy ? '#22c55e' : isSell ? '#ef4444' : '#94a3b8';
            var labelText = "".concat(isBuy ? 'B' : 'S', " ").concat(price, "/").concat(qty);
            return {
                x: x,
                y: price,
                marker: { size: 3, fillColor: color, strokeColor: color },
                label: {
                    text: labelText,
                    borderColor: color,
                    style: { background: '#0b1222', color: '#e2e8f0' },
                },
                // Tooltip via label text approximation
            };
        })
            .filter(Boolean);
        var clearingPoints = (Array.isArray(clearings) ? clearings : [])
            .map(function (c) {
            var _a;
            if (!c || !c.t)
                return null;
            var x = new Date(c.t).getTime();
            if (!isFinite(x))
                return null;
            var candle = candleByTs.get(x);
            var y = candle ? Number(candle.c) : undefined;
            var color = '#eab308';
            var funding = c.fundingRateEst;
            return {
                x: x,
                y: y,
                marker: { size: 3, fillColor: color, strokeColor: color },
                label: {
                    text: "Clearing: ".concat((0, helpers_1.fmt)(((_a = c.fundingRateEst) !== null && _a !== void 0 ? _a : 0) * 100, 5), "%"),
                    borderColor: color,
                    style: { background: '#0b1222', color: '#fde68a' },
                },
                // Additional context shown in tooltip formatter
                _meta: { funding: funding },
            };
        })
            .filter(Boolean);
        return { xaxis: __spreadArray(__spreadArray([], clearingPoints, true), tradePoints, true) };
    }, [trades, clearings, candleByTs]);
    var options = react_1.default.useMemo(function () { return ({
        chart: {
            type: 'candlestick',
            animations: { enabled: false },
            background: '#0b1222',
            foreColor: '#cbd5e1',
            id: 'chart-candles',
            zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
            toolbar: {
                show: true,
                tools: {
                    download: false,
                    selection: false,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true,
                },
                autoSelected: 'pan',
            },
        },
        theme: { mode: 'dark' },
        grid: { show: true, borderColor: '#1f2937' },
        xaxis: { type: 'datetime', min: minX, max: maxX },
        yaxis: {
            decimalsInFloat: 2,
            tooltip: { enabled: true },
        },
        tooltip: {
            shared: false,
            x: { format: 'dd MMM HH:mm' },
            y: {
                formatter: function (val) { return (isFinite(val) ? (0, helpers_1.fmt)(val) : ''); },
            },
        },
        annotations: annotations,
    }); }, [annotations, minX, maxX]);
    return (<react_apexcharts_1.default options={options} series={series} type="candlestick" height={420} width="100%"/>);
}
