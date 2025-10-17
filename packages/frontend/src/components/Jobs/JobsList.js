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
exports.JobsList = JobsList;
var react_1 = require("react");
var helpers_1 = require("../../helpers");
var material_1 = require("@mui/material");
function JobsList() {
    var _this = this;
    var _a, _b;
    var _c = react_1.default.useState([]), jobs = _c[0], setJobs = _c[1];
    var _d = react_1.default.useState(false), loading = _d[0], setLoading = _d[1];
    var _f = react_1.default.useState(null), error = _f[0], setError = _f[1];
    var _g = react_1.default.useState(null), info = _g[0], setInfo = _g[1];
    var _h = react_1.default.useState('list'), tab = _h[0], setTab = _h[1];
    // Details modal state
    var _j = react_1.default.useState(null), selectedId = _j[0], setSelectedId = _j[1];
    var _k = react_1.default.useState(false), detailsOpen = _k[0], setDetailsOpen = _k[1];
    var _l = react_1.default.useState(null), details = _l[0], setDetails = _l[1];
    var _m = react_1.default.useState(false), detailsLoading = _m[0], setDetailsLoading = _m[1];
    var _o = react_1.default.useState(null), detailsError = _o[0], setDetailsError = _o[1];
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
                    return [4 /*yield*/, (0, helpers_1.fetchJSON)('/api/jobs?limit=50')];
                case 2:
                    data = _a.sent();
                    setJobs(Array.isArray(data === null || data === void 0 ? void 0 : data.jobs) ? data.jobs : []);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    console.error(e_1);
                    setError('Не удалось загрузить список задач');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var fetchDetails = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var data, e_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setDetailsLoading(true);
                    setDetailsError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, helpers_1.fetchJSON)("/api/jobs/".concat(id))];
                case 2:
                    data = _b.sent();
                    setDetails((_a = data === null || data === void 0 ? void 0 : data.job) !== null && _a !== void 0 ? _a : null);
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _b.sent();
                    console.error(e_2);
                    setDetailsError('Не удалось загрузить детали задачи');
                    return [3 /*break*/, 5];
                case 4:
                    setDetailsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var openDetails = function (id) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSelectedId(id);
                    setDetailsOpen(true);
                    setDetails(null);
                    setDetailsError(null);
                    return [4 /*yield*/, fetchDetails(id)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var postJSON = function (url, body) { return __awaiter(_this, void 0, void 0, function () {
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
    }); };
    function runImportInstruments() {
        return __awaiter(this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setError(null);
                        setInfo(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, postJSON('/api/jobs', {
                                type: 'instruments.import.tinkoff',
                                payload: {},
                            })];
                    case 2:
                        _a.sent();
                        setInfo('Задача запуска импорта инструментов добавлена в очередь');
                        // Reload list to show the new job
                        return [4 /*yield*/, load()];
                    case 3:
                        // Reload list to show the new job
                        _a.sent();
                        setTab('list');
                        return [3 /*break*/, 5];
                    case 4:
                        e_3 = _a.sent();
                        console.error(e_3);
                        setError('Не удалось запустить импорт инструментов');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    react_1.default.useEffect(function () {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (<material_1.Card>
      <material_1.CardHeader title="Задачи" action={<material_1.Tabs value={tab} onChange={function (_e, v) { return setTab(v); }} aria-label="jobs tabs" textColor="inherit" indicatorColor="secondary">
            <material_1.Tab label="Список" value="list"/>
            <material_1.Tab label="Действия" value="actions"/>
          </material_1.Tabs>}/>
      <material_1.CardContent>
        {error && (<material_1.Typography color="error" sx={{ mb: 2 }}>
            {error}
          </material_1.Typography>)}
        {info && (<material_1.Typography sx={{ color: 'success.main', mb: 2 }}>{info}</material_1.Typography>)}
        {tab === 'list' ? (<material_1.TableContainer>
            <material_1.Table size="small">
              <material_1.TableHead>
                <material_1.TableRow>
                  <material_1.TableCell>ID</material_1.TableCell>
                  <material_1.TableCell>Тип</material_1.TableCell>
                  <material_1.TableCell>Статус</material_1.TableCell>
                  <material_1.TableCell>Создано</material_1.TableCell>
                  <material_1.TableCell>След. запуск</material_1.TableCell>
                  <material_1.TableCell align="right">Попытки</material_1.TableCell>
                  <material_1.TableCell align="right">Приоритет</material_1.TableCell>
                  <material_1.TableCell></material_1.TableCell>
                </material_1.TableRow>
              </material_1.TableHead>
              <material_1.TableBody>
                {jobs.map(function (j) {
                var _a, _b;
                return (<material_1.TableRow key={j.id} hover>
                    <material_1.TableCell>{j.id}</material_1.TableCell>
                    <material_1.TableCell>{j.type || '-'}</material_1.TableCell>
                    <material_1.TableCell>{j.status || '-'}</material_1.TableCell>
                    <material_1.TableCell>
                      {j.createdAt
                        ? new Date(j.createdAt).toLocaleString()
                        : '-'}
                    </material_1.TableCell>
                    <material_1.TableCell>
                      {j.nextRunAt
                        ? new Date(j.nextRunAt).toLocaleString()
                        : '-'}
                    </material_1.TableCell>
                    <material_1.TableCell align="right">{(_a = j.attempts) !== null && _a !== void 0 ? _a : 0}</material_1.TableCell>
                    <material_1.TableCell align="right">{(_b = j.priority) !== null && _b !== void 0 ? _b : '-'}</material_1.TableCell>
                    <material_1.TableCell align="right">
                      <material_1.Button onClick={function () { return openDetails(j.id); }}>
                        Подробнее
                      </material_1.Button>
                    </material_1.TableCell>
                  </material_1.TableRow>);
            })}
                {!loading && jobs.length === 0 && (<material_1.TableRow>
                    <material_1.TableCell colSpan={7}>
                      <material_1.Typography color="text.secondary">Нет задач</material_1.Typography>
                    </material_1.TableCell>
                  </material_1.TableRow>)}
              </material_1.TableBody>
            </material_1.Table>
          </material_1.TableContainer>) : (<material_1.Stack direction="column" spacing={2}>
            <material_1.Typography variant="subtitle1">
              Преднастройки запуска задач
            </material_1.Typography>
            <material_1.Button variant="contained" onClick={runImportInstruments} disabled={loading}>
              Запустить импорт инструментов
            </material_1.Button>
          </material_1.Stack>)}
      </material_1.CardContent>

      <material_1.Dialog open={detailsOpen} onClose={function () { return setDetailsOpen(false); }} maxWidth="md" fullWidth>
        <material_1.DialogTitle>
          {details
            ? "\u0417\u0430\u0434\u0430\u0447\u0430 ".concat(details.id, " \u2014 ").concat(details.type)
            : selectedId
                ? "\u0417\u0430\u0434\u0430\u0447\u0430 ".concat(selectedId)
                : 'Детали задачи'}
        </material_1.DialogTitle>
        <material_1.DialogContent dividers sx={{ pt: 2 }}>
          {detailsLoading && (<material_1.Stack direction="row" spacing={2} alignItems="center">
              <material_1.CircularProgress size={20}/>
              <material_1.Typography>Загрузка…</material_1.Typography>
            </material_1.Stack>)}
          {!detailsLoading && detailsError && (<material_1.Typography color="error">{detailsError}</material_1.Typography>)}
          {!detailsLoading && !detailsError && details && (<material_1.Stack spacing={2}>
              <material_1.Typography variant="subtitle2">Общее</material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                Статус: <b>{details.status}</b>
                {' • '}Приоритет: <b>{(_a = details.priority) !== null && _a !== void 0 ? _a : '-'}</b>
                {' • '}Попытки: <b>{(_b = details.attempts) !== null && _b !== void 0 ? _b : 0}</b>
                {typeof details.maxAttempts === 'number'
                ? " / ".concat(details.maxAttempts)
                : ''}
              </material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                Создано:{' '}
                {details.createdAt
                ? new Date(details.createdAt).toLocaleString()
                : '-'}
                {' • '}Плановый старт:{' '}
                {details.runAt ? new Date(details.runAt).toLocaleString() : '-'}
                {' • '}Старт:{' '}
                {details.startedAt
                ? new Date(details.startedAt).toLocaleString()
                : '-'}
                {' • '}Завершено:{' '}
                {details.finishedAt
                ? new Date(details.finishedAt).toLocaleString()
                : '-'}
                {' • '}Обновлено:{' '}
                {details.updatedAt
                ? new Date(details.updatedAt).toLocaleString()
                : '-'}
              </material_1.Typography>

              <div>
                <material_1.Typography variant="subtitle2" gutterBottom>
                  Параметры (payload)
                </material_1.Typography>
                <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
            }}>
                  {details.payload != null
                ? JSON.stringify(details.payload, null, 2)
                : '—'}
                </pre>
              </div>

              <div>
                <material_1.Typography variant="subtitle2" gutterBottom>
                  Результат
                </material_1.Typography>
                <pre style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
            }}>
                  {details.result != null
                ? JSON.stringify(details.result, null, 2)
                : '—'}
                </pre>
              </div>

              {details.error && (<div>
                  <material_1.Typography variant="subtitle2" gutterBottom color="error">
                    Ошибка
                  </material_1.Typography>
                  <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#b00020',
                }}>
                    {details.error}
                  </pre>
                </div>)}
            </material_1.Stack>)}
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={function () { return selectedId != null && fetchDetails(selectedId); }} disabled={detailsLoading}>
            Обновить
          </material_1.Button>
          <material_1.Button onClick={function () { return setDetailsOpen(false); }}>Закрыть</material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
    </material_1.Card>);
}
exports.default = JobsList;
