"use strict";
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
exports.App = App;
var react_1 = require("react");
var helpers_1 = require("./helpers");
var ws_1 = require("./ws");
var material_1 = require("@mui/material");
var styles_1 = require("@mui/material/styles");
var Header_1 = require("./components/Header");
var AnalyticsPanel_1 = require("./components/Analytics/AnalyticsPanel");
var InstrumentSummary_1 = require("./components/Summary/InstrumentSummary");
var UnderlyingSummary_1 = require("./components/Summary/UnderlyingSummary");
var PositionsPanel_1 = require("./components/Positions/PositionsPanel");
var CandlesPanel_1 = require("./components/Charts/CandlesPanel");
var JobsList_1 = require("./components/Jobs/JobsList");
var SourcesPanel_1 = require("./components/Sources/SourcesPanel");
var theme = (0, styles_1.createTheme)({
    palette: {
        mode: 'dark',
        background: { default: '#0f172a', paper: '#111827' },
    },
});
function App() {
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var useMemo = react_1.default.useMemo;
    var _a = useState('CNYRUBF'), ticker = _a[0], setTicker = _a[1];
    var _b = useState(''), status = _b[0], setStatus = _b[1];
    var _c = useState('1m'), scale = _c[0], setScale = _c[1];
    var _d = useState(null), summary = _d[0], setSummary = _d[1];
    var _f = useState(null), underlying = _f[0], setUnderlying = _f[1];
    var _g = useState([]), positions = _g[0], setPositions = _g[1];
    var _h = useState([]), candles = _h[0], setCandles = _h[1];
    var _j = useState([]), trades = _j[0], setTrades = _j[1];
    var _k = useState([]), clearings = _k[0], setClearings = _k[1];
    var _l = useState('overview'), activeTab = _l[0], setActiveTab = _l[1];
    var _m = useState(function () {
        if (typeof window !== 'undefined' && window.location) {
            var h = window.location.hash;
            if (h === '#/jobs')
                return 'jobs';
            if (h === '#/analytics')
                return 'analytics';
            if (h === '#/sources')
                return 'sources';
        }
        return 'instrument';
    }), route = _m[0], setRoute = _m[1];
    useEffect(function () {
        var onHash = function () {
            var h = window.location.hash;
            if (h === '#/jobs')
                setRoute('jobs');
            else if (h === '#/analytics')
                setRoute('analytics');
            else if (h === '#/sources')
                setRoute('sources');
            else
                setRoute('instrument');
        };
        window.addEventListener('hashchange', onHash);
        return function () { return window.removeEventListener('hashchange', onHash); };
    }, []);
    var aggCandles = useMemo(function () { return (0, helpers_1.aggregateCandles)(candles, scale); }, [candles, scale]);
    // WS to update candles and live quotes
    (0, ws_1.useWebSocket)(ticker, function (msg) {
        if (!msg || typeof msg !== 'object')
            return;
        if (msg.type === 'candles' && msg.mode === 'snapshot') {
            var pts = Array.isArray(msg.points) ? msg.points : [];
            setCandles(pts);
            if (Array.isArray(msg.clearings))
                setClearings(msg.clearings);
        }
        else if (msg.type === 'quote') {
            if (msg.summary)
                setSummary(msg.summary);
            if (msg.underlying)
                setUnderlying(msg.underlying);
        }
        else if (msg.type === 'trades') {
            if (Array.isArray(msg.trades))
                setTrades(msg.trades);
        }
        else if (msg.type === 'error') {
            console.warn('WS error:', msg.message || msg);
        }
        else if (msg.type === 'pong') {
            // ignore
        }
    });
    function loadAll(targetTicker) {
        return __awaiter(this, void 0, void 0, function () {
            var t, _a, sum, candlesResp, tradesResp, posResp, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        t = (targetTicker || ticker || '').trim();
                        if (!t)
                            return [2 /*return*/];
                        setStatus('Загрузка...');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.all([
                                (0, helpers_1.fetchJSON)("/api/summary?ticker=".concat(encodeURIComponent(t))),
                                (0, helpers_1.fetchJSON)("/api/candles?ticker=".concat(encodeURIComponent(t))),
                                (0, helpers_1.fetchJSON)("/api/trades?ticker=".concat(encodeURIComponent(t))),
                                (0, helpers_1.fetchJSON)("/api/positions?ticker=".concat(encodeURIComponent(t))),
                            ])];
                    case 2:
                        _a = _b.sent(), sum = _a[0], candlesResp = _a[1], tradesResp = _a[2], posResp = _a[3];
                        setSummary(sum || null);
                        if (sum && sum.underlying)
                            setUnderlying(sum.underlying);
                        else
                            setUnderlying(null);
                        setClearings((candlesResp && candlesResp.clearings) || []);
                        setCandles((candlesResp && candlesResp.points) || []);
                        setTrades((tradesResp && tradesResp.trades) || []);
                        setPositions((posResp && posResp.positions) || []);
                        setStatus('');
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        console.error(e_1);
                        setStatus('Ошибка загрузки данных');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    // Initial load
    useEffect(function () {
        loadAll(ticker);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (<styles_1.ThemeProvider theme={theme}>
      <material_1.CssBaseline />
      <Header_1.Header ticker={ticker} status={status} activeRoute={route} onNavigate={function (r) {
            if (r === 'jobs')
                window.location.hash = '#/jobs';
            else if (r === 'analytics')
                window.location.hash = '#/analytics';
            else if (r === 'sources')
                window.location.hash = '#/sources';
            else
                window.location.hash = '#/instrument';
        }} onTickerChange={setTicker} onLoad={function () { return loadAll(ticker); }}/>

      <material_1.Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {route === 'jobs' ? (<JobsList_1.JobsList />) : route === 'analytics' ? (<AnalyticsPanel_1.AnalyticsPanel />) : route === 'sources' ? (<SourcesPanel_1.SourcesPanel />) : (<>
            <material_1.Tabs value={activeTab} onChange={function (_e, v) { return setActiveTab(v); }} sx={{ mb: 2 }}>
              <material_1.Tab label="Обзор" value="overview"/>
              <material_1.Tab label="Аналитика" value="analytics"/>
            </material_1.Tabs>
              <material_1.Grid container spacing={2}>
                <material_1.Grid item xs={12} md={6}>
                  <InstrumentSummary_1.InstrumentSummary summary={summary}/>
                </material_1.Grid>

                {underlying && (<material_1.Grid item xs={12} md={6}>
                    <UnderlyingSummary_1.UnderlyingSummary underlying={underlying}/>
                  </material_1.Grid>)}

                <material_1.Grid item xs={12}>
                  <material_1.Card>
                    <material_1.CardHeader title="Позиции"/>
                    <material_1.CardContent>
                      <PositionsPanel_1.PositionsPanel positions={positions} summary={summary}/>
                    </material_1.CardContent>
                  </material_1.Card>
                </material_1.Grid>

                <material_1.Grid item xs={12}>
                  <CandlesPanel_1.CandlesPanel scale={scale} onScaleChange={function (s) { return setScale(s); }} candles={aggCandles} trades={trades} clearings={clearings}/>
                </material_1.Grid>
              </material_1.Grid>
          </>)}
      </material_1.Container>
    </styles_1.ThemeProvider>);
}
