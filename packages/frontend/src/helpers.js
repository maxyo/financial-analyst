"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_URL = void 0;
exports.fmt = fmt;
exports.fmtInt = fmtInt;
exports.fmtPct = fmtPct;
exports.signClass = signClass;
exports.scaleToMs = scaleToMs;
exports.aggregateCandles = aggregateCandles;
exports.fetchJSON = fetchJSON;
exports.numColor = numColor;
exports.API_URL = 'http://localhost:3000';
function fmt(n, digits) {
    if (digits === void 0) { digits = 4; }
    var num = Number(n);
    if (n == null || Number.isNaN(num))
        return '-';
    try {
        var f = new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
            useGrouping: true,
        });
        return f.format(num);
    }
    catch (_a) {
        return num.toFixed(digits);
    }
}
function fmtInt(n) {
    var num = Number(n);
    if (n == null || Number.isNaN(num))
        return '-';
    try {
        var f = new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: true,
        });
        return f.format(num);
    }
    catch (_a) {
        return String(Math.trunc(num));
    }
}
function fmtPct(v, digits) {
    if (digits === void 0) { digits = 4; }
    var num = Number(v);
    if (v == null || !isFinite(num))
        return '-';
    return "".concat(fmt(num * 100, digits), "%");
}
function signClass(v) {
    var num = Number(v);
    if (v == null || !isFinite(num))
        return '';
    return num > 0 ? 'pos' : num < 0 ? 'neg' : '';
}
function scaleToMs(scale) {
    switch (scale) {
        case '1m':
            return 60 * 1000;
        case '5m':
            return 5 * 60 * 1000;
        case '15m':
            return 15 * 60 * 1000;
        case '1h':
            return 60 * 60 * 1000;
        default:
            return 60 * 1000;
    }
}
function aggregateCandles(candles, scale) {
    var _a, _b, _c;
    if (!Array.isArray(candles) || candles.length === 0)
        return [];
    if (scale === '1m')
        return candles.slice();
    var step = scaleToMs(scale);
    var map = new Map();
    for (var _i = 0, candles_1 = candles; _i < candles_1.length; _i++) {
        var p = candles_1[_i];
        if (!p || !p.t)
            continue;
        var ts = new Date(p.t).getTime();
        if (!isFinite(ts))
            continue;
        var bucket = Math.floor(ts / step) * step;
        var agg = map.get(bucket);
        if (!agg) {
            agg = {
                t: new Date(bucket).toISOString(),
                o: p.o,
                h: p.h,
                l: p.l,
                c: p.c,
                v: (_a = p.v) !== null && _a !== void 0 ? _a : 0,
                _firstTs: ts,
                _lastTs: ts,
            };
            map.set(bucket, agg);
        }
        else {
            if (ts < agg._firstTs) {
                agg._firstTs = ts;
                agg.o = p.o;
            }
            if (ts > agg._lastTs) {
                agg._lastTs = ts;
                agg.c = p.c;
            }
            if (p.h != null)
                agg.h = Math.max((_b = agg.h) !== null && _b !== void 0 ? _b : p.h, p.h);
            if (p.l != null)
                agg.l = Math.min((_c = agg.l) !== null && _c !== void 0 ? _c : p.l, p.l);
            agg.v = (agg.v || 0) + (p.v || 0);
        }
    }
    var result = Array.from(map.entries())
        .sort(function (a, b) { return a[0] - b[0]; })
        .map(function (_a) {
        var a = _a[1];
        var clean = __assign({}, a);
        delete clean._firstTs;
        delete clean._lastTs;
        return clean;
    });
    return result;
}
function fetchJSON(url) {
    return __awaiter(this, void 0, void 0, function () {
        var res, txt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(exports.API_URL).concat(url))];
                case 1:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.text().catch(function () { return ''; })];
                case 2:
                    txt = _a.sent();
                    throw new Error("HTTP ".concat(res.status, ": ").concat(txt));
                case 3: return [2 /*return*/, res.json()];
            }
        });
    });
}
function numColor(val) {
    var n = Number(val);
    if (!isFinite(n))
        return 'text.primary';
    return n > 0 ? 'success.main' : n < 0 ? 'error.main' : 'text.secondary';
}
