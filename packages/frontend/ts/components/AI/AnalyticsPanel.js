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
exports.AnalyticsPanel = AnalyticsPanel;
var react_1 = require("react");
var material_1 = require("@mui/material");
var helpers_1 = require("../../helpers");
function postJSON(url, body) {
    return __awaiter(this, void 0, void 0, function () {
        var full, res, txt;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    full = "".concat(helpers_1.API_URL).concat(url.startsWith('/') ? '' : '/').concat(url);
                    return [4 /*yield*/, fetch(full, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body !== null && body !== void 0 ? body : {}),
                        })];
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
function tryParseJSON(text) {
    try {
        return JSON.parse(text);
    }
    catch (_a) {
        return undefined;
    }
}
function AnalyticsPanel(_a) {
    var _this = this;
    var _b;
    var defaultInstrument = _a.defaultInstrument;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _c = useState([]), profiles = _c[0], setProfiles = _c[1];
    var _d = useState(undefined), selectedId = _d[0], setSelectedId = _d[1];
    var _e = useState(null), editing = _e[0], setEditing = _e[1];
    var _f = useState('[]'), sourcesText = _f[0], setSourcesText = _f[1];
    var _g = useState(''), sourcesError = _g[0], setSourcesError = _g[1];
    // Live validate sources JSON
    useEffect(function () {
        if (!(sourcesText === null || sourcesText === void 0 ? void 0 : sourcesText.trim())) {
            setSourcesError('');
            return;
        }
        try {
            var parsed = JSON.parse(sourcesText);
            if (!Array.isArray(parsed)) {
                setSourcesError('Ожидается массив объектов');
            }
            else {
                setSourcesError('');
            }
        }
        catch (e) {
            setSourcesError('Некорректный JSON');
        }
    }, [sourcesText]);
    var _h = useState([]), runs = _h[0], setRuns = _h[1];
    var _j = useState(null), selectedRunReport = _j[0], setSelectedRunReport = _j[1];
    var _k = useState({ instrumentKey: defaultInstrument || '' }), runForm = _k[0], setRunForm = _k[1];
    var _l = useState(''), status = _l[0], setStatus = _l[1];
    var _m = useState(false), loadingProfiles = _m[0], setLoadingProfiles = _m[1];
    var _o = useState(false), loadingRuns = _o[0], setLoadingRuns = _o[1];
    var _p = useState(false), saving = _p[0], setSaving = _p[1];
    var _q = useState(false), running = _q[0], setRunning = _q[1];
    var _r = useState(function () { return (typeof localStorage !== 'undefined' && localStorage.getItem('ai.profilesCollapsed') === '1'); }), profilesCollapsed = _r[0], setProfilesCollapsed = _r[1];
    function loadProfiles() {
        return __awaiter(this, void 0, void 0, function () {
            var data, det, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setLoadingProfiles(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, , 7, 8]);
                        return [4 /*yield*/, (0, helpers_1.fetchJSON)("/api/ai/profiles")];
                    case 2:
                        data = _c.sent();
                        setProfiles(data.items || []);
                        if (!selectedId) return [3 /*break*/, 6];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, (0, helpers_1.fetchJSON)("/api/ai/profiles/".concat(selectedId))];
                    case 4:
                        det = _c.sent();
                        setEditing(det);
                        setSourcesText(JSON.stringify((_b = det.sources) !== null && _b !== void 0 ? _b : [], null, 2));
                        return [3 /*break*/, 6];
                    case 5:
                        _a = _c.sent();
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        setLoadingProfiles(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    function loadRuns() {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoadingRuns(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        return [4 /*yield*/, (0, helpers_1.fetchJSON)("/api/ai/runs")];
                    case 2:
                        data = _a.sent();
                        setRuns(Array.isArray(data.jobs) ? data.jobs : []);
                        return [3 /*break*/, 4];
                    case 3:
                        setLoadingRuns(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    useEffect(function () {
        loadProfiles().catch(console.error);
        loadRuns().catch(console.error);
        var t = setInterval(function () {
            loadRuns().catch(function () { });
        }, 5000);
        return function () { return clearInterval(t); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(function () {
        if (!selectedId)
            return;
        (0, helpers_1.fetchJSON)("/api/ai/profiles/".concat(selectedId)).then(function (p) {
            var _a;
            setEditing(p);
            setSourcesText(JSON.stringify((_a = p.sources) !== null && _a !== void 0 ? _a : [], null, 2));
            setRunForm(function (prev) { return (__assign(__assign({}, prev), { instrumentKey: p.instrument_ticker || prev.instrumentKey })); });
        }).catch(console.error);
    }, [selectedId]);
    var onNewProfile = function () {
        var p = { name: 'Новый профиль', description: '', instrument_ticker: defaultInstrument || '', sources: [] };
        setEditing(p);
        setSelectedId(undefined);
        setSourcesText('[]');
    };
    var onSaveProfile = function () { return __awaiter(_this, void 0, void 0, function () {
        var body, parsed, saved, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editing || sourcesError)
                        return [2 /*return*/];
                    setSaving(true);
                    setStatus('Сохранение профиля...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    body = { id: editing.id, name: editing.name, description: editing.description, instrument_ticker: editing.instrument_ticker };
                    parsed = tryParseJSON(sourcesText);
                    if (parsed && Array.isArray(parsed)) {
                        body.sources = parsed.map(function (s) { var _a, _b; return ({ source_id: Number((_a = s.source_id) !== null && _a !== void 0 ? _a : s.sourceId), filters_json: (_b = s.filters_json) !== null && _b !== void 0 ? _b : s.filters }); });
                    }
                    return [4 /*yield*/, postJSON("/api/ai/profiles", body)];
                case 2:
                    saved = _a.sent();
                    setEditing(saved);
                    setSelectedId(saved.id);
                    return [4 /*yield*/, loadProfiles()];
                case 3:
                    _a.sent();
                    setStatus('');
                    return [3 /*break*/, 6];
                case 4:
                    e_1 = _a.sent();
                    console.error(e_1);
                    setStatus("\u041E\u0448\u0438\u0431\u043A\u0430: ".concat((e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || e_1));
                    return [3 /*break*/, 6];
                case 5:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var onRunAnalysis = function () { return __awaiter(_this, void 0, void 0, function () {
        var payload, e_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(editing === null || editing === void 0 ? void 0 : editing.id)) {
                        setStatus('Сначала сохраните профиль');
                        return [2 /*return*/];
                    }
                    setRunning(true);
                    setStatus('Запуск анализа...');
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, 5, 6]);
                    payload = {
                        profileId: editing.id,
                        instrumentKey: runForm.instrumentKey || editing.instrument_ticker,
                    };
                    if (runForm.windowStart || runForm.windowEnd)
                        payload.window = { start: (_a = runForm.windowStart) !== null && _a !== void 0 ? _a : null, end: (_b = runForm.windowEnd) !== null && _b !== void 0 ? _b : null };
                    if (runForm.maxDocs)
                        payload.maxDocs = runForm.maxDocs;
                    return [4 /*yield*/, postJSON("/api/ai/analyze", payload)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, loadRuns()];
                case 3:
                    _c.sent();
                    setStatus('Запущено');
                    setTimeout(function () { return setStatus(''); }, 1500);
                    return [3 /*break*/, 6];
                case 4:
                    e_2 = _c.sent();
                    console.error(e_2);
                    setStatus("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430: ".concat((e_2 === null || e_2 === void 0 ? void 0 : e_2.message) || e_2));
                    return [3 /*break*/, 6];
                case 5:
                    setRunning(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var onOpenReport = function (reportId) { return __awaiter(_this, void 0, void 0, function () {
        var rep, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, helpers_1.fetchJSON)("/api/ai/report/".concat(reportId))];
                case 1:
                    rep = _a.sent();
                    setSelectedRunReport(rep);
                    return [3 /*break*/, 3];
                case 2:
                    e_3 = _a.sent();
                    console.error(e_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (<material_1.Grid container spacing={2}>
      <material_1.Grid item xs={12} md={4}>
        <material_1.Card>
          <material_1.CardHeader title="Профили анализа" action={<material_1.Button variant="contained" onClick={onNewProfile}>Новый</material_1.Button>}/>
          <material_1.CardContent>
            {loadingProfiles ? (<material_1.CircularProgress size={20}/>) : profiles.length ? (<material_1.List dense>
                {profiles.map(function (p) { return (<material_1.ListItem key={p.id} disablePadding>
                    <material_1.ListItemButton selected={selectedId === p.id} onClick={function () { return setSelectedId(p.id); }}>
                      <material_1.ListItemText primary={p.name} secondary={p.instrument_ticker || ''}/>
                    </material_1.ListItemButton>
                  </material_1.ListItem>); })}
              </material_1.List>) : (<material_1.Typography variant="body2" color="text.secondary">Нет профилей</material_1.Typography>)}
          </material_1.CardContent>
        </material_1.Card>
      </material_1.Grid>

      <material_1.Grid item xs={12} md={8}>
        <material_1.Card>
          <material_1.CardHeader title="Редактор профиля"/>
          <material_1.CardContent>
            {editing ? (<material_1.Stack spacing={2}>
                <material_1.TextField label="Название" value={editing.name} onChange={function (e) { return setEditing(__assign(__assign({}, editing), { name: e.target.value })); }} fullWidth/>
                <material_1.TextField label="Тикер инструмента" value={editing.instrument_ticker || ''} onChange={function (e) { return setEditing(__assign(__assign({}, editing), { instrument_ticker: e.target.value })); }} fullWidth/>
                <material_1.TextField label="Описание" value={editing.description || ''} onChange={function (e) { return setEditing(__assign(__assign({}, editing), { description: e.target.value })); }} multiline rows={2} fullWidth/>
                <material_1.Typography variant="subtitle2">{"Источники (JSON массив объектов { \"source_id\", \"filters_json\" })"}</material_1.Typography>
                <material_1.TextField value={sourcesText} onChange={function (e) { return setSourcesText(e.target.value); }} multiline rows={8} fullWidth error={!!sourcesError} helperText={sourcesError || ' '}/>
                <material_1.Stack direction="row" spacing={2} alignItems="center">
                  <material_1.Button variant="contained" onClick={onSaveProfile} disabled={!!sourcesError || saving}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </material_1.Button>
                  {saving && <material_1.CircularProgress size={18}/>}
                  <material_1.Typography variant="body2" color="text.secondary">{status}</material_1.Typography>
                </material_1.Stack>
              </material_1.Stack>) : (<material_1.Typography variant="body2" color="text.secondary">Выберите профиль или создайте новый</material_1.Typography>)}
          </material_1.CardContent>
        </material_1.Card>
      </material_1.Grid>

      <material_1.Grid item xs={12}>
        <material_1.Card>
          <material_1.CardHeader title="Запуск анализа"/>
          <material_1.CardContent>
            <material_1.Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <material_1.TextField label="Инструмент" value={runForm.instrumentKey} onChange={function (e) { return setRunForm(__assign(__assign({}, runForm), { instrumentKey: e.target.value })); }} size="small"/>
              <material_1.TextField label="Начало окна (ISO)" value={runForm.windowStart || ''} onChange={function (e) { return setRunForm(__assign(__assign({}, runForm), { windowStart: e.target.value })); }} size="small" sx={{ minWidth: 220 }}/>
              <material_1.TextField label="Конец окна (ISO)" value={runForm.windowEnd || ''} onChange={function (e) { return setRunForm(__assign(__assign({}, runForm), { windowEnd: e.target.value })); }} size="small" sx={{ minWidth: 220 }}/>
              <material_1.TextField label="Макс. док-тов" type="number" value={runForm.maxDocs || ''} onChange={function (e) { return setRunForm(__assign(__assign({}, runForm), { maxDocs: Number(e.target.value) || undefined })); }} size="small" sx={{ width: 140 }}/>
              <material_1.Button variant="contained" onClick={onRunAnalysis} disabled={!(editing === null || editing === void 0 ? void 0 : editing.id) || running}>
                {running ? 'Запуск...' : 'Запустить'}
              </material_1.Button>
              {running && <material_1.CircularProgress size={18}/>}
            </material_1.Stack>
          </material_1.CardContent>
        </material_1.Card>
      </material_1.Grid>

      <material_1.Grid item xs={12} md={6}>
        <material_1.Card>
          <material_1.CardHeader title="Запуски (последние)"/>
          <material_1.CardContent>
            {loadingRuns ? (<material_1.CircularProgress size={20}/>) : runs.length ? (<material_1.List dense>
                {runs.map(function (j) {
                var rid = (j.result && j.result.reportId);
                return (<material_1.ListItem key={j.id} secondaryAction={rid ? <material_1.Button size="small" onClick={function () { return onOpenReport(rid); }}>Отчет #{rid}</material_1.Button> : undefined}>
                      <material_1.ListItemText primary={"".concat(j.status.toUpperCase(), " \u2022 ").concat(new Date(j.createdAt).toLocaleString('ru-RU'))} secondary={j.error ? "\u041E\u0448\u0438\u0431\u043A\u0430: ".concat(j.error) : j.type}/>
                    </material_1.ListItem>);
            })}
              </material_1.List>) : (<material_1.Typography variant="body2" color="text.secondary">Нет запусков</material_1.Typography>)}
          </material_1.CardContent>
        </material_1.Card>
      </material_1.Grid>

      <material_1.Grid item xs={12} md={6}>
        <material_1.Card>
          <material_1.CardHeader title={selectedRunReport ? "\u041E\u0442\u0447\u0435\u0442 #".concat(selectedRunReport.id) : 'Отчет'}/>
          <material_1.CardContent>
            {selectedRunReport ? (<material_1.Box>
                <material_1.Typography variant="subtitle1">Инструмент: {selectedRunReport.instrument_key || ''}</material_1.Typography>
                <material_1.Typography variant="body2" color="text.secondary">Создан: {new Date(selectedRunReport.created_at).toLocaleString('ru-RU')}</material_1.Typography>
                <material_1.Divider sx={{ my: 1 }}/>
                {(((_b = selectedRunReport.content_json) === null || _b === void 0 ? void 0 : _b.summary_bullets) || []).map(function (b, idx) { return (<material_1.Typography key={idx} variant="body2">• {b}</material_1.Typography>); })}
              </material_1.Box>) : (<material_1.Typography variant="body2" color="text.secondary">Выберите запуск с готовым отчетом</material_1.Typography>)}
          </material_1.CardContent>
        </material_1.Card>
      </material_1.Grid>
    </material_1.Grid>);
}
