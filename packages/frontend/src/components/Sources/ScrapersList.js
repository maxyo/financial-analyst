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
exports.ScrapersList = ScrapersList;
var react_1 = require("react");
var material_1 = require("@mui/material");
var client_1 = require("../../api/client");
var icons_material_1 = require("@mui/icons-material");
function ScrapersList() {
    var _a;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _b = useState(null), scrapers = _b[0], setScrapers = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(false), isDialogOpen = _e[0], setDialogOpen = _e[1];
    var _f = useState(null), editing = _f[0], setEditing = _f[1];
    var _g = useState({
        name: '',
        type: 'API',
        api: { url: '' },
        html: {
            url: '',
            selectors: [],
            headers: {},
            timeoutMs: 10000,
            pagination: undefined,
            document: undefined,
        },
        postProcessors: [],
        showJson: false,
        jsonSnapshot: null,
    }), form = _g[0], setForm = _g[1];
    var _h = useState(false), saving = _h[0], setSaving = _h[1];
    var _j = useState(null), runningId = _j[0], setRunningId = _j[1];
    var _k = useState(null), snack = _k[0], setSnack = _k[1];
    function openCreate() {
        // navigate to scraper creation page (by analogy with profiles)
        window.location.hash = '#/scraper/new';
    }
    function openEdit(s) {
        // navigate to edit page
        window.location.hash = "#/scraper/".concat(s.id);
    }
    function closeDialog() {
        setDialogOpen(false);
    }
    function loadScrapers() {
        return __awaiter(this, void 0, void 0, function () {
            var data, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerList()];
                    case 2:
                        data = _a.sent();
                        setScrapers(data);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        console.error(e_1);
                        setError('Не удалось загрузить список сборщиков');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleSave() {
        return __awaiter(this, void 0, void 0, function () {
            var config, payload, payload, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setSaving(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 8, 9]);
                        config = {};
                        {
                            // Build config from form fields; JSON view is read-only and not used for submission
                            if (form.type === 'API') {
                                if (!form.api.url.trim()) {
                                    setError('Укажите URL');
                                    setSaving(false);
                                    return [2 /*return*/];
                                }
                                config = { url: form.api.url };
                            }
                            else if (form.type === 'HTML') {
                                if (!form.html.url.trim()) {
                                    setError('Укажите URL');
                                    setSaving(false);
                                    return [2 /*return*/];
                                }
                                config = __assign(__assign({ url: form.html.url, selectors: form.html.selectors, headers: form.html.headers, timeoutMs: form.html.timeoutMs }, (form.html.pagination
                                    ? { pagination: form.html.pagination }
                                    : {})), (form.html.document ? { document: form.html.document } : {}));
                            }
                        }
                        if (!editing) return [3 /*break*/, 3];
                        payload = {
                            name: form.name,
                            type: form.type,
                            config: config,
                        };
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerUpdate(editing.id, payload)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        payload = {
                            name: form.name,
                            type: form.type,
                            config: config,
                        };
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerCreate(payload)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        setDialogOpen(false);
                        return [4 /*yield*/, loadScrapers()];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        e_2 = _a.sent();
                        console.error(e_2);
                        setError('Не удалось сохранить сборщик');
                        return [3 /*break*/, 9];
                    case 8:
                        setSaving(false);
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    function handleRun(id) {
        return __awaiter(this, void 0, void 0, function () {
            var resp, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setRunningId(id);
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerRun(id)];
                    case 1:
                        resp = _a.sent();
                        setSnack({
                            open: true,
                            message: resp && resp.jobId
                                ? "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u043E, jobId: ".concat(resp.jobId)
                                : 'Задача поставлена в очередь',
                        });
                        return [3 /*break*/, 4];
                    case 2:
                        e_3 = _a.sent();
                        console.error(e_3);
                        setError('Не удалось запустить сборщик');
                        return [3 /*break*/, 4];
                    case 3:
                        setRunningId(null);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function handleDelete(id) {
        return __awaiter(this, void 0, void 0, function () {
            var e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!confirm('Удалить сборщик?'))
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerRemove(id)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, loadScrapers()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_4 = _a.sent();
                        console.error(e_4);
                        setError('Не удалось удалить сборщик');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    useEffect(function () {
        loadScrapers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (<material_1.Box>
      <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <material_1.Button variant="contained" startIcon={<icons_material_1.AddCircle />} onClick={openCreate}>
          Добавить сборщика
        </material_1.Button>
        {loading && <material_1.Typography variant="body2">Загрузка...</material_1.Typography>}
        {error && (<material_1.Typography variant="body2" color="error">
            {error}
          </material_1.Typography>)}
      </material_1.Box>

      <material_1.List dense>
        {((_a = scrapers === null || scrapers === void 0 ? void 0 : scrapers.items) === null || _a === void 0 ? void 0 : _a.length)
            ? scrapers.items.map(function (s) { return (<material_1.ListItem key={s.id} divider secondaryAction={<material_1.Box>
                    <material_1.IconButton edge="end" aria-label="run" onClick={function () { return handleRun(s.id); }} disabled={runningId === s.id} title="Запустить">
                      <icons_material_1.PlayArrow />
                    </material_1.IconButton>
                    <material_1.IconButton edge="end" aria-label="edit" onClick={function () { return openEdit(s); }} title="Редактировать">
                      <icons_material_1.Edit />
                    </material_1.IconButton>
                    <material_1.IconButton edge="end" aria-label="delete" onClick={function () { return handleDelete(s.id); }} title="Удалить">
                      <icons_material_1.Delete />
                    </material_1.IconButton>
                  </material_1.Box>}>
                <material_1.ListItemText primary={s.name} secondary={"\u0422\u0438\u043F: ".concat(s.type)}/>
              </material_1.ListItem>); })
            : !loading && (<material_1.Typography variant="body2">Сборщики отсутствуют</material_1.Typography>)}
      </material_1.List>
      <material_1.Snackbar open={!!(snack === null || snack === void 0 ? void 0 : snack.open)} autoHideDuration={3000} onClose={function () { return setSnack(null); }} message={(snack === null || snack === void 0 ? void 0 : snack.message) || ''}/>
    </material_1.Box>);
}
