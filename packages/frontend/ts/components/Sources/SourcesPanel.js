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
exports.SourcesPanel = SourcesPanel;
var react_1 = require("react");
var helpers_1 = require("../../helpers");
var material_1 = require("@mui/material");
function tryParseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch (_a) {
        return text; // fallback to raw string
    }
}
function SourcesPanel() {
    var _this = this;
    var _a = react_1.default.useState([]), rows = _a[0], setRows = _a[1];
    var _b = react_1.default.useState(false), loading = _b[0], setLoading = _b[1];
    var _c = react_1.default.useState(null), error = _c[0], setError = _c[1];
    var _d = react_1.default.useState(null), info = _d[0], setInfo = _d[1];
    // Create dialog state
    var _e = react_1.default.useState(false), createOpen = _e[0], setCreateOpen = _e[1];
    var _f = react_1.default.useState(''), newName = _f[0], setNewName = _f[1];
    var _g = react_1.default.useState(''), newType = _g[0], setNewType = _g[1];
    var _h = react_1.default.useState(true), newActive = _h[0], setNewActive = _h[1];
    var _j = react_1.default.useState(JSON.stringify({ type: 'time_interval', options: { value: 1, unit: 'hour' } }, null, 2)), newStrategy = _j[0], setNewStrategy = _j[1];
    var _k = react_1.default.useState('{}'), newConfig = _k[0], setNewConfig = _k[1];
    var load = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, helpers_1.fetchJSON)('/api/data-sources')];
                case 2:
                    data = _a.sent();
                    setRows(Array.isArray(data === null || data === void 0 ? void 0 : data.sources) ? data.sources : []);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    console.error(e_1);
                    setError('Не удалось загрузить список источников');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    react_1.default.useEffect(function () {
        load();
    }, []);
    function putJSON(url, body) {
        return __awaiter(this, void 0, void 0, function () {
            var res, txt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(helpers_1.API_URL).concat(url), {
                            method: 'PUT',
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
    function postJSON(url, body) {
        return __awaiter(this, void 0, void 0, function () {
            var res, txt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(helpers_1.API_URL).concat(url), {
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
    var updateField = function (id, key, value) {
        setRows(function (prev) {
            return prev.map(function (r) {
                var _a;
                return (r.id === id ? __assign(__assign({}, r), (_a = {}, _a[key] = value, _a)) : r);
            });
        });
    };
    var saveRow = function (r) { return __awaiter(_this, void 0, void 0, function () {
        var payload, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setError(null);
                    setInfo(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    payload = {
                        name: r.name,
                        source_type: r.source_type,
                        is_active: r.is_active === 1 ? true : false,
                    };
                    // Allow JSON object or string; try to parse textareas if they are strings
                    payload.config = typeof r.config === 'string' ? tryParseJson(r.config) : r.config;
                    payload.update_strategy =
                        typeof r.update_strategy === 'string'
                            ? tryParseJson(r.update_strategy)
                            : r.update_strategy;
                    return [4 /*yield*/, putJSON("/api/data-sources/".concat(r.id), payload)];
                case 2:
                    _a.sent();
                    setInfo('Сохранено');
                    return [4 /*yield*/, load()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_2 = _a.sent();
                    console.error(e_2);
                    setError('Ошибка сохранения');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var openCreate = function () {
        setNewName('');
        setNewType('');
        setNewActive(true);
        setNewStrategy(JSON.stringify({ type: 'time_interval', options: { value: 1, unit: 'hour' } }, null, 2));
        setNewConfig('{}');
        setCreateOpen(true);
    };
    var createSource = function () { return __awaiter(_this, void 0, void 0, function () {
        var payload, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setError(null);
                    setInfo(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    payload = {
                        name: newName,
                        source_type: newType,
                        is_active: newActive,
                        update_strategy: tryParseJson(newStrategy),
                        config: tryParseJson(newConfig),
                    };
                    return [4 /*yield*/, postJSON('/api/data-sources', payload)];
                case 2:
                    _a.sent();
                    setCreateOpen(false);
                    return [4 /*yield*/, load()];
                case 3:
                    _a.sent();
                    setInfo('Источник создан');
                    return [3 /*break*/, 5];
                case 4:
                    e_3 = _a.sent();
                    console.error(e_3);
                    setError('Ошибка создания источника');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<material_1.Card>
      <material_1.CardHeader title="Источники" action={<material_1.Stack direction="row" spacing={1} alignItems="center">
            {loading && <material_1.CircularProgress size={18}/>}
            <material_1.Button variant="outlined" onClick={load} disabled={loading}>
              Обновить
            </material_1.Button>
            <material_1.Button variant="contained" onClick={openCreate}>
              Создать источник
            </material_1.Button>
          </material_1.Stack>}/>
      <material_1.CardContent>
        {error && (<material_1.Typography color="error" sx={{ mb: 1 }}>
            {error}
          </material_1.Typography>)}
        {info && (<material_1.Typography color="success.main" sx={{ mb: 1 }}>
            {info}
          </material_1.Typography>)}
        <material_1.TableContainer>
          <material_1.Table size="small">
            <material_1.TableHead>
              <material_1.TableRow>
                <material_1.TableCell>ID</material_1.TableCell>
                <material_1.TableCell>Название</material_1.TableCell>
                <material_1.TableCell>Тип</material_1.TableCell>
                <material_1.TableCell>Активен</material_1.TableCell>
                <material_1.TableCell>Стратегия обновления (JSON)</material_1.TableCell>
                <material_1.TableCell>Конфиг (JSON)</material_1.TableCell>
                <material_1.TableCell align="right">Действия</material_1.TableCell>
              </material_1.TableRow>
            </material_1.TableHead>
            <material_1.TableBody>
              {rows.map(function (r) {
            var _a, _b;
            return (<material_1.TableRow key={r.id} hover>
                  <material_1.TableCell>{r.id}</material_1.TableCell>
                  <material_1.TableCell sx={{ minWidth: 200 }}>
                    <material_1.TextField value={r.name || ''} onChange={function (e) { return updateField(r.id, 'name', e.target.value); }} size="small" fullWidth/>
                  </material_1.TableCell>
                  <material_1.TableCell sx={{ minWidth: 160 }}>
                    <material_1.TextField value={r.source_type || ''} onChange={function (e) {
                    return updateField(r.id, 'source_type', e.target.value);
                }} size="small" fullWidth/>
                  </material_1.TableCell>
                  <material_1.TableCell>
                    <material_1.Checkbox checked={r.is_active === 1} onChange={function (e) {
                    return updateField(r.id, 'is_active', e.target.checked ? 1 : 0);
                }}/>
                  </material_1.TableCell>
                  <material_1.TableCell sx={{ minWidth: 260 }}>
                    <material_1.TextField value={typeof r.update_strategy === 'string'
                    ? r.update_strategy
                    : JSON.stringify((_a = r.update_strategy) !== null && _a !== void 0 ? _a : {}, null, 2)} onChange={function (e) {
                    return updateField(r.id, 'update_strategy', e.target.value);
                }} size="small" fullWidth multiline minRows={3}/>
                  </material_1.TableCell>
                  <material_1.TableCell sx={{ minWidth: 260 }}>
                    <material_1.TextField value={typeof r.config === 'string'
                    ? r.config
                    : JSON.stringify((_b = r.config) !== null && _b !== void 0 ? _b : {}, null, 2)} onChange={function (e) { return updateField(r.id, 'config', e.target.value); }} size="small" fullWidth multiline minRows={3}/>
                  </material_1.TableCell>
                  <material_1.TableCell align="right">
                    <material_1.Stack direction="row" spacing={1} justifyContent="flex-end">
                      <material_1.Button variant="contained" size="small" onClick={function () { return saveRow(r); }} disabled={loading}>
                        Сохранить
                      </material_1.Button>
                    </material_1.Stack>
                  </material_1.TableCell>
                </material_1.TableRow>);
        })}
              {rows.length === 0 && !loading && (<material_1.TableRow>
                  <material_1.TableCell colSpan={7}>
                    <material_1.Typography color="text.secondary">
                      Нет данных
                    </material_1.Typography>
                  </material_1.TableCell>
                </material_1.TableRow>)}
            </material_1.TableBody>
          </material_1.Table>
        </material_1.TableContainer>
      </material_1.CardContent>

      <material_1.Dialog open={createOpen} onClose={function () { return setCreateOpen(false); }} maxWidth="md" fullWidth>
        <material_1.DialogTitle>Создать источник</material_1.DialogTitle>
        <material_1.DialogContent dividers>
          <material_1.Stack spacing={2} sx={{ mt: 1 }}>
            <material_1.TextField label="Название" value={newName} onChange={function (e) { return setNewName(e.target.value); }} fullWidth size="small"/>
            <material_1.TextField label="Тип" value={newType} onChange={function (e) { return setNewType(e.target.value); }} fullWidth size="small"/>
            <material_1.Stack direction="row" spacing={1} alignItems="center">
              <material_1.Checkbox checked={newActive} onChange={function (e) { return setNewActive(e.target.checked); }}/>
              <material_1.Typography>Активен</material_1.Typography>
            </material_1.Stack>
            <material_1.TextField label="Стратегия обновления (JSON)" value={newStrategy} onChange={function (e) { return setNewStrategy(e.target.value); }} fullWidth multiline minRows={3} size="small"/>
            <material_1.TextField label="Конфиг (JSON)" value={newConfig} onChange={function (e) { return setNewConfig(e.target.value); }} fullWidth multiline minRows={3} size="small"/>
          </material_1.Stack>
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={function () { return setCreateOpen(false); }}>Отмена</material_1.Button>
          <material_1.Button variant="contained" onClick={createSource} disabled={!newName || !newType}>
            Создать
          </material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
    </material_1.Card>);
}
