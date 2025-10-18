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
// import { useWebSocket } from './ws';
var material_1 = require("@mui/material");
var styles_1 = require("@mui/material/styles");
var Header_1 = require("./components/Header");
var AnalyticsPanel_1 = require("./components/Analytics/AnalyticsPanel");
var ReportsPage_1 = require("./components/Analytics/ReportsPage");
var ProfileEditPage_1 = require("./components/Analytics/ProfileEditPage");
var ScraperEditPage_1 = require("./components/Sources/ScraperEditPage");
var JobsList_1 = require("./components/Jobs/JobsList");
var SourcesPanel_1 = require("./components/Sources/SourcesPanel");
function ReportsRouterView() {
    var _a = react_1.default.useState(null), profileId = _a[0], setProfileId = _a[1];
    var _b = react_1.default.useState(undefined), profileName = _b[0], setProfileName = _b[1];
    react_1.default.useEffect(function () {
        var h = (typeof window !== 'undefined' && window.location ? window.location.hash : '') || '';
        // Accept formats: #/reports?profileId=123 or #/reports/123
        var id = null;
        if (h.startsWith('#/reports/')) {
            var tail = h.substring('#/reports/'.length);
            var n = Number(tail.split(/[?#]/)[0]);
            if (Number.isFinite(n))
                id = n;
        }
        else if (h.startsWith('#/reports')) {
            var m = h.match(/profileId=(\d+)/);
            if (m && m[1]) {
                var n = Number(m[1]);
                if (Number.isFinite(n))
                    id = n;
            }
        }
        setProfileId(id);
        // Optionally, can parse profileName from hash too, e.g., &name=...
        var mName = h.match(/name=([^&#]+)/);
        if (mName && mName[1])
            try {
                setProfileName(decodeURIComponent(mName[1]));
            }
            catch (_a) { }
    }, []);
    var onBack = react_1.default.useCallback(function () {
        window.history.back();
    }, []);
    if (!profileId) {
        return <material_1.Typography variant="body2" color="error">Не указан profileId</material_1.Typography>;
    }
    return <ReportsPage_1.ReportsPage profileId={profileId} profileName={profileName} onBack={onBack}/>;
}
function ProfileRouterView() {
    var _a = react_1.default.useState(undefined), id = _a[0], setId = _a[1];
    react_1.default.useEffect(function () {
        var h = (typeof window !== 'undefined' && window.location ? window.location.hash : '') || '';
        if (h === '#/profile/new') {
            setId(undefined);
        }
        else if (h.startsWith('#/profile/')) {
            var tail = h.substring('#/profile/'.length);
            var n = Number(tail.split(/[?#]/)[0]);
            if (Number.isFinite(n))
                setId(n);
        }
    }, []);
    var onBack = react_1.default.useCallback(function () { window.history.back(); }, []);
    return <ProfileEditPage_1.ProfileEditPage id={id} onBack={onBack}/>;
}
function ScraperRouterView() {
    var _a = react_1.default.useState(undefined), id = _a[0], setId = _a[1];
    react_1.default.useEffect(function () {
        var h = (typeof window !== 'undefined' && window.location ? window.location.hash : '') || '';
        if (h === '#/scraper/new') {
            setId(undefined);
        }
        else if (h.startsWith('#/scraper/')) {
            var tail = h.substring('#/scraper/'.length);
            var idStr = tail.split(/[?#]/)[0];
            if (idStr)
                setId(idStr);
        }
    }, []);
    var onBack = react_1.default.useCallback(function () { window.history.back(); }, []);
    return <ScraperEditPage_1.ScraperEditPage id={id} onBack={onBack}/>;
}
var theme = (0, styles_1.createTheme)({
    palette: {
        mode: 'dark',
        background: { default: '#0f172a', paper: '#111827' },
    },
});
function App() {
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _a = useState('CNYRUBF'), ticker = _a[0], setTicker = _a[1];
    var _b = useState(''), status = _b[0], setStatus = _b[1];
    var _c = useState(null), summary = _c[0], setSummary = _c[1];
    var _d = useState(null), underlying = _d[0], setUnderlying = _d[1];
    var _e = useState([]), positions = _e[0], setPositions = _e[1];
    var _f = useState([]), candles = _f[0], setCandles = _f[1];
    var _g = useState([]), trades = _g[0], setTrades = _g[1];
    var _h = useState([]), clearings = _h[0], setClearings = _h[1];
    var _j = useState('overview'), activeTab = _j[0], setActiveTab = _j[1];
    var _k = useState(function () {
        if (typeof window !== 'undefined' && window.location) {
            var h = window.location.hash;
            if (h === '#/jobs')
                return 'jobs';
            if (h === '#/analytics')
                return 'analytics';
            if (h === '#/sources')
                return 'sources';
            if (h.startsWith('#/reports'))
                return 'reports';
            if (h.startsWith('#/profile'))
                return 'profile';
            if (h.startsWith('#/scraper'))
                return 'scraper';
        }
        return 'analytics';
    }), route = _k[0], setRoute = _k[1];
    useEffect(function () {
        var onHash = function () {
            var h = window.location.hash;
            if (h === '#/jobs')
                setRoute('jobs');
            else if (h === '#/analytics')
                setRoute('analytics');
            else if (h === '#/sources')
                setRoute('sources');
            else if (h.startsWith('#/reports'))
                setRoute('reports');
            else if (h.startsWith('#/profile'))
                setRoute('profile');
            else if (h.startsWith('#/scraper'))
                setRoute('scraper');
            else
                setRoute('analytics');
        };
        window.addEventListener('hashchange', onHash);
        return function () { return window.removeEventListener('hashchange', onHash); };
    }, []);
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
                window.location.hash = '#/analytics';
        }} onTickerChange={setTicker} onLoad={function () { return loadAll(ticker); }}/>

      <material_1.Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {route === 'jobs' ? (<JobsList_1.JobsList />) : route === 'analytics' ? (<AnalyticsPanel_1.AnalyticsPanel />) : route === 'sources' ? (<SourcesPanel_1.SourcesPanel />) : route === 'reports' ? (<material_1.Card>
            <material_1.CardHeader title="Аналитика"/>
            <material_1.CardContent>
              <ReportsRouterView />
            </material_1.CardContent>
          </material_1.Card>) : route === 'profile' ? (<material_1.Card>
            <material_1.CardHeader title="Аналитика"/>
            <material_1.CardContent>
              <ProfileRouterView />
            </material_1.CardContent>
          </material_1.Card>) : route === 'scraper' ? (<material_1.Card>
            <material_1.CardHeader title="Источники"/>
            <material_1.CardContent>
              <ScraperRouterView />
            </material_1.CardContent>
          </material_1.Card>) : (<AnalyticsPanel_1.AnalyticsPanel />)}
      </material_1.Container>
    </styles_1.ThemeProvider>);
}
