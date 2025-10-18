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
exports.ScraperEditPage = ScraperEditPage;
var react_1 = require("react");
var material_1 = require("@mui/material");
var icons_material_1 = require("@mui/icons-material");
var client_1 = require("../../api/client");
// Edit page for Scraper, migrated from modal in ScrapersList
function ScraperEditPage(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    var id = _a.id, onBack = _a.onBack;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var isNew = !id;
    var _t = useState(false), loading = _t[0], setLoading = _t[1];
    var _u = useState(false), saving = _u[0], setSaving = _u[1];
    var _v = useState(null), error = _v[0], setError = _v[1];
    var _w = useState(null), scraper = _w[0], setScraper = _w[1];
    var _x = useState({
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
    }), form = _x[0], setForm = _x[1];
    function load() {
        return __awaiter(this, void 0, void 0, function () {
            var s, raw, rawCfg, cfg, api, html, postProcessors, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (isNew || !id)
                            return [2 /*return*/];
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerGetOne(id)];
                    case 2:
                        s = _a.sent();
                        setScraper(s);
                        raw = s.data || s || {};
                        rawCfg = raw.config || {};
                        cfg = rawCfg && typeof rawCfg === 'object' && rawCfg[raw.type]
                            ? rawCfg[raw.type]
                            : rawCfg;
                        api = {
                            url: typeof (cfg === null || cfg === void 0 ? void 0 : cfg.url) === 'string' ? cfg.url : '',
                        };
                        html = {
                            url: typeof (cfg === null || cfg === void 0 ? void 0 : cfg.url) === 'string' ? cfg.url : '',
                            selectors: Array.isArray(cfg === null || cfg === void 0 ? void 0 : cfg.selectors)
                                ? cfg.selectors.filter(function (x) {
                                    return x &&
                                        typeof x.name === 'string' &&
                                        typeof x.selector === 'string';
                                })
                                : [],
                            headers: (cfg === null || cfg === void 0 ? void 0 : cfg.headers) && typeof cfg.headers === 'object' ? cfg.headers : {},
                            timeoutMs: typeof (cfg === null || cfg === void 0 ? void 0 : cfg.timeoutMs) === 'number' ? cfg.timeoutMs : 10000,
                            pagination: (cfg === null || cfg === void 0 ? void 0 : cfg.pagination) && typeof cfg.pagination === 'object'
                                ? {
                                    nextSelector: typeof cfg.pagination.nextSelector === 'string'
                                        ? cfg.pagination.nextSelector
                                        : undefined,
                                    nextUrlTemplate: typeof cfg.pagination.nextUrlTemplate === 'string'
                                        ? cfg.pagination.nextUrlTemplate
                                        : undefined,
                                    pageParam: typeof cfg.pagination.pageParam === 'string'
                                        ? cfg.pagination.pageParam
                                        : undefined,
                                    startPage: typeof cfg.pagination.startPage === 'number'
                                        ? cfg.pagination.startPage
                                        : undefined,
                                    maxPages: typeof cfg.pagination.maxPages === 'number'
                                        ? cfg.pagination.maxPages
                                        : undefined,
                                }
                                : undefined,
                            document: (cfg === null || cfg === void 0 ? void 0 : cfg.document) && typeof cfg.document === 'object'
                                ? {
                                    linkSelector: typeof cfg.document.linkSelector === 'string'
                                        ? cfg.document.linkSelector
                                        : '',
                                    linkAttr: typeof cfg.document.linkAttr === 'string'
                                        ? cfg.document.linkAttr
                                        : undefined,
                                    titleSelector: typeof cfg.document.titleSelector === 'string'
                                        ? cfg.document.titleSelector
                                        : undefined,
                                    contentSelector: typeof cfg.document.contentSelector === 'string'
                                        ? cfg.document.contentSelector
                                        : undefined,
                                    baseUrl: typeof cfg.document.baseUrl === 'string'
                                        ? cfg.document.baseUrl
                                        : undefined,
                                    maxDocsPerPage: typeof cfg.document.maxDocsPerPage === 'number'
                                        ? cfg.document.maxDocsPerPage
                                        : undefined,
                                }
                                : undefined,
                        };
                        postProcessors = Array.isArray(s.postProcessors)
                            ? s.postProcessors.map(function (pp) {
                                var _a, _b, _c;
                                return ({
                                    type: 'TRIM_WHITESPACE',
                                    config: {
                                        collapseMultipleSpaces: !!((_a = pp === null || pp === void 0 ? void 0 : pp.config) === null || _a === void 0 ? void 0 : _a.collapseMultipleSpaces),
                                        collapseNewlines: !!((_b = pp === null || pp === void 0 ? void 0 : pp.config) === null || _b === void 0 ? void 0 : _b.collapseNewlines),
                                        trimEachLine: ((_c = pp === null || pp === void 0 ? void 0 : pp.config) === null || _c === void 0 ? void 0 : _c.trimEachLine) !== false,
                                    },
                                });
                            })
                            : [];
                        setForm({
                            name: raw.name || '',
                            type: raw.type,
                            api: api,
                            html: html,
                            postProcessors: postProcessors,
                            showJson: false,
                        });
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        console.error(e_1);
                        setError('Не удалось загрузить сборщик');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    useEffect(function () {
        load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [id]);
    function save() {
        return __awaiter(this, void 0, void 0, function () {
            var config, pp, payload, payload, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setSaving(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 7, 8]);
                        config = {};
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
                            config = __assign(__assign({ url: form.html.url, selectors: form.html.selectors, headers: form.html.headers, timeoutMs: form.html.timeoutMs }, (form.html.pagination ? { pagination: form.html.pagination } : {})), (form.html.document ? { document: form.html.document } : {}));
                        }
                        pp = (form.postProcessors || []).map(function (p) { return ({
                            type: p.type,
                            config: __assign({}, p.config),
                        }); });
                        if (!isNew) return [3 /*break*/, 3];
                        payload = {
                            data: {
                                name: form.name,
                                type: form.type,
                                config: config,
                                postProcessors: pp,
                            },
                        };
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerCreate(payload)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        payload = {
                            data: {
                                name: form.name,
                                type: form.type,
                                config: config,
                                postProcessors: pp,
                            },
                        };
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerUpdate(id, payload)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        onBack();
                        return [3 /*break*/, 8];
                    case 6:
                        e_2 = _a.sent();
                        console.error(e_2);
                        setError('Не удалось сохранить сборщик');
                        return [3 /*break*/, 8];
                    case 7:
                        setSaving(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    return (<material_1.Box>
      <material_1.Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
            flexWrap: 'wrap',
        }}>
        <material_1.Button startIcon={<icons_material_1.ArrowBack />} onClick={onBack}>
          Назад
        </material_1.Button>
        <material_1.Typography variant="h6">
          {isNew
            ? 'Создать сборщика'
            : "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0431\u043E\u0440\u0449\u0438\u043A\u0430".concat(scraper ? ": ".concat(((_b = scraper.data) === null || _b === void 0 ? void 0 : _b.name) || '') : '')}
        </material_1.Typography>
      </material_1.Box>

      {loading && <material_1.Typography variant="body2">Загрузка...</material_1.Typography>}
      {error && (<material_1.Typography variant="body2" color="error">
          {error}
        </material_1.Typography>)}

      <material_1.Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 720 }}>
        <material_1.TextField label="Название" value={form.name} onChange={function (e) { return setForm(__assign(__assign({}, form), { name: e.target.value })); }} fullWidth/>
        <material_1.TextField select label="Тип" value={form.type} onChange={function (e) { return setForm(__assign(__assign({}, form), { type: e.target.value })); }} fullWidth>
          <material_1.MenuItem value="API">API</material_1.MenuItem>
          <material_1.MenuItem value="HTML">HTML</material_1.MenuItem>
        </material_1.TextField>

        {form.type === 'API' && (<material_1.Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <material_1.Typography variant="subtitle2">Настройки API</material_1.Typography>
            <material_1.TextField label="URL" value={form.api.url} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { api: __assign(__assign({}, form.api), { url: e.target.value }) }));
            }} fullWidth/>
          </material_1.Box>)}

        {form.type === 'HTML' && (<material_1.Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <material_1.Typography variant="subtitle2">Настройки HTML</material_1.Typography>
            <material_1.TextField label="URL" value={form.html.url} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { url: e.target.value }) }));
            }} fullWidth/>

            <material_1.Box>
              <material_1.Typography variant="body2" sx={{ mb: 1 }}>
                Селекторы
              </material_1.Typography>
              {form.html.selectors.map(function (sel, idx) { return (<material_1.Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <material_1.TextField size="small" label="Имя" value={sel.name} onChange={function (e) {
                    var selectors = form.html.selectors.slice();
                    selectors[idx] = __assign(__assign({}, selectors[idx]), { name: e.target.value });
                    setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { selectors: selectors }) }));
                }} sx={{ flex: 1 }}/>
                  <material_1.TextField size="small" label="Селектор" value={sel.selector} onChange={function (e) {
                    var selectors = form.html.selectors.slice();
                    selectors[idx] = __assign(__assign({}, selectors[idx]), { selector: e.target.value });
                    setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { selectors: selectors }) }));
                }} sx={{ flex: 2 }}/>
                  <material_1.Button onClick={function () {
                    var selectors = form.html.selectors.slice();
                    selectors.splice(idx, 1);
                    setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { selectors: selectors }) }));
                }}>
                    -
                  </material_1.Button>
                </material_1.Box>); })}
              <material_1.Button size="small" onClick={function () {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { selectors: __spreadArray(__spreadArray([], form.html.selectors, true), [
                            { name: '', selector: '' },
                        ], false) }) }));
            }}>
                Добавить селектор
              </material_1.Button>
            </material_1.Box>

            <material_1.Box>
              <material_1.Typography variant="body2" sx={{ mb: 1 }}>
                Заголовки
              </material_1.Typography>
              {Object.entries(form.html.headers).map(function (_a, idx) {
                var k = _a[0], v = _a[1];
                return (<material_1.Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <material_1.TextField size="small" label="Ключ" value={k} onChange={function (e) {
                        var headers = __assign({}, form.html.headers);
                        delete headers[k];
                        headers[e.target.value] = v;
                        setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { headers: headers }) }));
                    }} sx={{ flex: 1 }}/>
                  <material_1.TextField size="small" label="Значение" value={String(v)} onChange={function (e) {
                        var headers = __assign({}, form.html.headers);
                        headers[k] = e.target.value;
                        setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { headers: headers }) }));
                    }} sx={{ flex: 2 }}/>
                  <material_1.Button onClick={function () {
                        var headers = __assign({}, form.html.headers);
                        delete headers[k];
                        setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { headers: headers }) }));
                    }}>
                    -
                  </material_1.Button>
                </material_1.Box>);
            })}
              <material_1.Button size="small" onClick={function () {
                var headers = __assign({}, form.html.headers);
                var i = 1;
                var key = "Header-".concat(i);
                while (headers[key] !== undefined) {
                    i++;
                    key = "Header-".concat(i);
                }
                headers[key] = '';
                setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { headers: headers }) }));
            }}>
                Добавить заголовок
              </material_1.Button>
            </material_1.Box>

            <material_1.TextField type="number" label="Таймаут, мс" value={form.html.timeoutMs} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { timeoutMs: Number(e.target.value) || 0 }) }));
            }} fullWidth/>

            <material_1.Box>
              <material_1.Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                Пагинация (опционально)
              </material_1.Typography>
              <material_1.TextField size="small" label="CSS селектор кнопки 'Далее'" value={((_c = form.html.pagination) === null || _c === void 0 ? void 0 : _c.nextSelector) || ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { pagination: __assign(__assign({}, (form.html.pagination || {})), { nextSelector: e.target.value || undefined }) }) }));
            }} fullWidth sx={{ mb: 1 }}/>
              <material_1.TextField size="small" label="Шаблон следующего URL" value={((_d = form.html.pagination) === null || _d === void 0 ? void 0 : _d.nextUrlTemplate) || ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { pagination: __assign(__assign({}, (form.html.pagination || {})), { nextUrlTemplate: e.target.value || undefined }) }) }));
            }} fullWidth sx={{ mb: 1 }}/>
              <material_1.TextField size="small" label="Имя параметра страницы" value={((_e = form.html.pagination) === null || _e === void 0 ? void 0 : _e.pageParam) || ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { pagination: __assign(__assign({}, (form.html.pagination || {})), { pageParam: e.target.value || undefined }) }) }));
            }} fullWidth sx={{ mb: 1 }}/>
              <material_1.Box sx={{ display: 'flex', gap: 1 }}>
                <material_1.TextField size="small" type="number" label="Начальная страница" value={(_g = (_f = form.html.pagination) === null || _f === void 0 ? void 0 : _f.startPage) !== null && _g !== void 0 ? _g : ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { pagination: __assign(__assign({}, (form.html.pagination || {})), { startPage: e.target.value
                                ? Number(e.target.value)
                                : undefined }) }) }));
            }} sx={{ flex: 1 }}/>
                <material_1.TextField size="small" type="number" label="Макс. страниц" value={(_j = (_h = form.html.pagination) === null || _h === void 0 ? void 0 : _h.maxPages) !== null && _j !== void 0 ? _j : ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { pagination: __assign(__assign({}, (form.html.pagination || {})), { maxPages: e.target.value
                                ? Number(e.target.value)
                                : undefined }) }) }));
            }} sx={{ flex: 1 }}/>
              </material_1.Box>
            </material_1.Box>

            <material_1.Box>
              <material_1.Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                Документы (опционально)
              </material_1.Typography>
              <material_1.TextField size="small" label="Селектор ссылки на документ" value={((_k = form.html.document) === null || _k === void 0 ? void 0 : _k.linkSelector) || ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { document: __assign(__assign({}, (form.html.document || {})), { linkSelector: e.target.value }) }) }));
            }} fullWidth sx={{ mb: 1 }}/>
              <material_1.TextField size="small" label="Атрибут ссылки (по умолчанию href)" value={((_l = form.html.document) === null || _l === void 0 ? void 0 : _l.linkAttr) || ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { document: __assign(__assign({}, (form.html.document || {})), { linkAttr: e.target.value || undefined }) }) }));
            }} fullWidth sx={{ mb: 1 }}/>
              <material_1.TextField size="small" label="Селектор заголовка" value={((_m = form.html.document) === null || _m === void 0 ? void 0 : _m.titleSelector) || ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { document: __assign(__assign({}, (form.html.document || {})), { titleSelector: e.target.value || undefined }) }) }));
            }} fullWidth sx={{ mb: 1 }}/>
              <material_1.TextField size="small" label="Селектор контента" value={((_o = form.html.document) === null || _o === void 0 ? void 0 : _o.contentSelector) || ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { document: __assign(__assign({}, (form.html.document || {})), { contentSelector: e.target.value || undefined }) }) }));
            }} fullWidth sx={{ mb: 1 }}/>
              <material_1.TextField size="small" label="Базовый URL" value={((_p = form.html.document) === null || _p === void 0 ? void 0 : _p.baseUrl) || ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { document: __assign(__assign({}, (form.html.document || {})), { baseUrl: e.target.value || undefined }) }) }));
            }} fullWidth sx={{ mb: 1 }}/>
              <material_1.TextField size="small" type="number" label="Макс. документов на страницу" value={(_r = (_q = form.html.document) === null || _q === void 0 ? void 0 : _q.maxDocsPerPage) !== null && _r !== void 0 ? _r : ''} onChange={function (e) {
                return setForm(__assign(__assign({}, form), { html: __assign(__assign({}, form.html), { document: __assign(__assign({}, (form.html.document || {})), { maxDocsPerPage: e.target.value
                                ? Number(e.target.value)
                                : undefined }) }) }));
            }} fullWidth/>
            </material_1.Box>
          </material_1.Box>)}

        {/* Post-processors editor */}
        <material_1.Box component={material_1.Paper} variant="outlined" sx={{ p: 1 }}>
          <material_1.Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
        }}>
            <material_1.Typography variant="body2">Постпроцессоры</material_1.Typography>
            <material_1.Button size="small" onClick={function () {
            return setForm(__assign(__assign({}, form), { postProcessors: __spreadArray(__spreadArray([], (form.postProcessors || []), true), [
                    {
                        type: 'TRIM_WHITESPACE',
                        config: {
                            collapseMultipleSpaces: true,
                            collapseNewlines: true,
                            trimEachLine: true,
                        },
                    },
                ], false) }));
        }}>
              Добавить
            </material_1.Button>
          </material_1.Box>
          {((_s = form.postProcessors) === null || _s === void 0 ? void 0 : _s.length) ? (form.postProcessors.map(function (pp, idx) { return (<material_1.Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                <material_1.Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <material_1.TextField select size="small" label="Тип" value={pp.type} onChange={function (e) {
                var list = form.postProcessors.slice();
                list[idx] = __assign(__assign({}, pp), { type: e.target.value });
                setForm(__assign(__assign({}, form), { postProcessors: list }));
            }} sx={{ width: 220 }}>
                    <material_1.MenuItem value="TRIM_WHITESPACE">TRIM_WHITESPACE</material_1.MenuItem>
                  </material_1.TextField>
                  <material_1.Button size="small" onClick={function () {
                var list = form.postProcessors.slice();
                list.splice(idx, 1);
                setForm(__assign(__assign({}, form), { postProcessors: list }));
            }}>
                    Удалить
                  </material_1.Button>
                </material_1.Box>
                {pp.type === 'TRIM_WHITESPACE' && (<material_1.Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <material_1.TextField size="small" label="Схлопывать пробелы" value={pp.config.collapseMultipleSpaces ? 'Да' : 'Нет'} onChange={function (e) {
                    var list = form.postProcessors.slice();
                    list[idx] = __assign(__assign({}, pp), { config: __assign(__assign({}, pp.config), { collapseMultipleSpaces: e.target.value === 'Да' }) });
                    setForm(__assign(__assign({}, form), { postProcessors: list }));
                }} select sx={{ width: 220 }}>
                      <material_1.MenuItem value={'Да'}>Да</material_1.MenuItem>
                      <material_1.MenuItem value={'Нет'}>Нет</material_1.MenuItem>
                    </material_1.TextField>
                    <material_1.TextField size="small" label="Схлопывать пустые строки" value={pp.config.collapseNewlines ? 'Да' : 'Нет'} onChange={function (e) {
                    var list = form.postProcessors.slice();
                    list[idx] = __assign(__assign({}, pp), { config: __assign(__assign({}, pp.config), { collapseNewlines: e.target.value === 'Да' }) });
                    setForm(__assign(__assign({}, form), { postProcessors: list }));
                }} select sx={{ width: 260 }}>
                      <material_1.MenuItem value={'Да'}>Да</material_1.MenuItem>
                      <material_1.MenuItem value={'Нет'}>Нет</material_1.MenuItem>
                    </material_1.TextField>
                    <material_1.TextField size="small" label="Триммировать каждую строку" value={pp.config.trimEachLine ? 'Да' : 'Нет'} onChange={function (e) {
                    var list = form.postProcessors.slice();
                    list[idx] = __assign(__assign({}, pp), { config: __assign(__assign({}, pp.config), { trimEachLine: e.target.value === 'Да' }) });
                    setForm(__assign(__assign({}, form), { postProcessors: list }));
                }} select sx={{ width: 280 }}>
                      <material_1.MenuItem value={'Да'}>Да</material_1.MenuItem>
                      <material_1.MenuItem value={'Нет'}>Нет</material_1.MenuItem>
                    </material_1.TextField>
                  </material_1.Box>)}
              </material_1.Box>); })) : (<material_1.Typography variant="body2" color="text.secondary">
              Пока нет постпроцессоров
            </material_1.Typography>)}
        </material_1.Box>

        {/* JSON viewer (read-only) */}
        <material_1.Box component={material_1.Paper} variant="outlined" sx={{ p: 1 }}>
          <material_1.Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <material_1.Typography variant="body2">
              JSON конфиг (только просмотр)
            </material_1.Typography>
          </material_1.Box>
          <material_1.TextField label="Config (JSON)" value={JSON.stringify(form.type === 'API'
            ? { url: form.api.url }
            : __assign(__assign({ url: form.html.url, selectors: form.html.selectors, headers: form.html.headers, timeoutMs: form.html.timeoutMs }, (form.html.pagination
                ? { pagination: form.html.pagination }
                : {})), (form.html.document
                ? { document: form.html.document }
                : {})), null, 2)} fullWidth multiline minRows={4} InputProps={{ readOnly: true }}/>
        </material_1.Box>

        <material_1.Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <material_1.Button variant="contained" startIcon={<icons_material_1.Save />} onClick={save} disabled={saving || !form.name.trim()}>
            Сохранить
          </material_1.Button>
        </material_1.Box>
      </material_1.Box>
    </material_1.Box>);
}
