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
exports.DocumentsList = DocumentsList;
var react_1 = require("react");
var material_1 = require("@mui/material");
var client_1 = require("../../api/client");
function DocumentsList() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _g = useState(null), docs = _g[0], setDocs = _g[1];
    var _h = useState(false), loading = _h[0], setLoading = _h[1];
    var _j = useState(null), error = _j[0], setError = _j[1];
    var _k = useState(20), limit = _k[0], setLimit = _k[1];
    var _l = useState(0), offset = _l[0], setOffset = _l[1];
    var _m = useState(''), titleFilter = _m[0], setTitleFilter = _m[1];
    var _o = useState(''), textFilter = _o[0], setTextFilter = _o[1];
    var _p = useState(''), scraperId = _p[0], setScraperId = _p[1];
    var _q = useState(''), dateFrom = _q[0], setDateFrom = _q[1];
    var _r = useState(''), dateTo = _r[0], setDateTo = _r[1];
    var _s = useState(null), scrapers = _s[0], setScrapers = _s[1];
    var _t = useState(false), scrapersLoading = _t[0], setScrapersLoading = _t[1];
    var _u = useState(false), detailsOpen = _u[0], setDetailsOpen = _u[1];
    var _v = useState(null), selectedId = _v[0], setSelectedId = _v[1];
    var _w = useState(null), details = _w[0], setDetails = _w[1];
    var _x = useState(false), detailsLoading = _x[0], setDetailsLoading = _x[1];
    var _y = useState(null), detailsError = _y[0], setDetailsError = _y[1];
    function loadDocuments() {
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
                        return [4 /*yield*/, client_1.DocumentsService.documentsControllerList(limit, offset, titleFilter.trim() || undefined, textFilter.trim() || undefined, scraperId || undefined, dateFrom ? new Date(dateFrom).toISOString() : undefined, dateTo ? new Date(dateTo).toISOString() : undefined)];
                    case 2:
                        data = _a.sent();
                        setDocs(data);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        console.error(e_1);
                        setError('Не удалось загрузить список документов');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function openDetails(id) {
        return __awaiter(this, void 0, void 0, function () {
            var data, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setSelectedId(id);
                        setDetailsOpen(true);
                        setDetails(null);
                        setDetailsError(null);
                        setDetailsLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, client_1.DocumentsService.documentsControllerGetOne(id)];
                    case 2:
                        data = _a.sent();
                        setDetails(data);
                        return [3 /*break*/, 5];
                    case 3:
                        e_2 = _a.sent();
                        console.error(e_2);
                        setDetailsError('Не удалось загрузить детали документа');
                        return [3 /*break*/, 5];
                    case 4:
                        setDetailsLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function closeDetails() {
        setDetailsOpen(false);
        setSelectedId(null);
        setDetails(null);
        setDetailsError(null);
        setDetailsLoading(false);
    }
    useEffect(function () {
        // load scrapers once
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var list, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, 3, 4]);
                        setScrapersLoading(true);
                        return [4 /*yield*/, client_1.ScrapersService.scrapersControllerList(200, 0)];
                    case 1:
                        list = _a.sent();
                        setScrapers(list);
                        return [3 /*break*/, 4];
                    case 2:
                        e_3 = _a.sent();
                        // ignore scraper load errors; dropdown will be empty
                        console.warn('Failed to load scrapers', e_3);
                        return [3 /*break*/, 4];
                    case 3:
                        setScrapersLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        }); })();
    }, []);
    useEffect(function () {
        loadDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit, offset]);
    if (loading)
        return <material_1.Typography variant="body2">Загрузка...</material_1.Typography>;
    if (error)
        return (<material_1.Typography variant="body2" color="error" sx={{ mb: 2 }}>
      {error}
    </material_1.Typography>);
    return (<>
      <material_1.Box sx={{ mb: 2 }}>
        <material_1.Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <material_1.TextField size="small" label="Название" value={titleFilter} onChange={function (e) { return setTitleFilter(e.target.value); }}/>
          <material_1.TextField size="small" label="Поиск в тексте" value={textFilter} onChange={function (e) { return setTextFilter(e.target.value); }}/>

          <material_1.FormControl size="small" sx={{ minWidth: 200 }}>
            <material_1.InputLabel id="scraper-select-label">Скрапер</material_1.InputLabel>
            <material_1.Select labelId="scraper-select-label" label="Скрапер" value={scraperId} onChange={function (e) { return setScraperId(String(e.target.value)); }}>
              <material_1.MenuItem value=""><em>Все</em></material_1.MenuItem>
              {(_a = scrapers === null || scrapers === void 0 ? void 0 : scrapers.items) === null || _a === void 0 ? void 0 : _a.map(function (s) { return (<material_1.MenuItem key={s.id} value={s.id}>{s.name || s.id}</material_1.MenuItem>); })}
            </material_1.Select>
          </material_1.FormControl>

          <material_1.TextField size="small" label="От" type="date" value={dateFrom} onChange={function (e) { return setDateFrom(e.target.value); }} InputLabelProps={{ shrink: true }}/>
          <material_1.TextField size="small" label="До" type="date" value={dateTo} onChange={function (e) { return setDateTo(e.target.value); }} InputLabelProps={{ shrink: true }}/>

          <material_1.Button variant="contained" size="small" onClick={function () { setOffset(0); loadDocuments(); }} disabled={loading || scrapersLoading}>
            Применить
          </material_1.Button>
        </material_1.Stack>
      </material_1.Box>

      <material_1.List dense>
        {((_b = docs === null || docs === void 0 ? void 0 : docs.items) === null || _b === void 0 ? void 0 : _b.length) ? (docs.items.map(function (d) {
            var _a, _b, _c, _d;
            return (<material_1.ListItem key={d.id} divider secondaryAction={<material_1.Button size="small" variant="outlined" onClick={function () { return openDetails(d.id); }}>Подробнее</material_1.Button>}>
              <material_1.ListItemText primary={d.title} secondary={"\u0421\u043A\u0440\u0430\u043F\u0435\u0440: ".concat((_d = (_b = (_a = d.scraper) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = d.scraper) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : '—', " \u2022 \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E: ").concat(new Date(d.scrapedAt).toLocaleString())}/>
            </material_1.ListItem>);
        })) : (<material_1.Typography variant="body2">Документы отсутствуют</material_1.Typography>)}
      </material_1.List>

      <material_1.Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <material_1.Box>
          <material_1.Typography variant="caption">
            {docs ? "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u043E ".concat(docs.items.length, " \u0438\u0437 ").concat(docs.total) : ''}
          </material_1.Typography>
        </material_1.Box>
        <material_1.Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <material_1.TextField select size="small" label="На странице" value={limit} onChange={function (e) { setLimit(Number(e.target.value)); setOffset(0); }} sx={{ width: 120 }}>
            {[10, 20, 50, 100].map(function (n) { return (<material_1.MenuItem key={n} value={n}>{n}</material_1.MenuItem>); })}
          </material_1.TextField>
          <material_1.Button size="small" onClick={function () { return setOffset(Math.max(0, offset - limit)); }} disabled={offset === 0 || loading}>Назад</material_1.Button>
          <material_1.Button size="small" onClick={function () { return setOffset(offset + limit); }} disabled={!docs || offset + limit >= docs.total || loading}>Вперёд</material_1.Button>
        </material_1.Box>
      </material_1.Box>

      <material_1.Dialog open={detailsOpen} onClose={closeDetails} fullWidth maxWidth="md">
        <material_1.DialogTitle>Детали документа</material_1.DialogTitle>
        <material_1.DialogContent dividers>
          {detailsLoading && (<material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <material_1.CircularProgress size={20}/>
              <material_1.Typography variant="body2">Загрузка...</material_1.Typography>
            </material_1.Box>)}
          {detailsError && (<material_1.Typography variant="body2" color="error">{detailsError}</material_1.Typography>)}
          {details && (<material_1.Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <material_1.Typography variant="subtitle1">{details.title}</material_1.Typography>
              <material_1.Typography variant="body2" color="text.secondary">
                Скрапер: {(_f = (_d = (_c = details.scraper) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : (_e = details.scraper) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : '—'} • Извлечено: {new Date(details.scrapedAt).toLocaleString()}
              </material_1.Typography>
              <material_1.Typography variant="caption" color="text.secondary">Хэш содержимого: {details.contentHash}</material_1.Typography>
              <material_1.Box sx={{ mt: 2 }}>
                <material_1.Typography variant="subtitle2" gutterBottom>Текст документа</material_1.Typography>
                <material_1.Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', bgcolor: 'background.default', p: 1, borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                  {details.content}
                </material_1.Box>
              </material_1.Box>
            </material_1.Box>)}
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={closeDetails}>Закрыть</material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
    </>);
}
