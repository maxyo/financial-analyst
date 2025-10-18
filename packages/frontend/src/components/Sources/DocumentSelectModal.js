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
exports.DocumentSelectModal = DocumentSelectModal;
exports.DocumentSelect = DocumentSelect;
var react_1 = require("react");
var material_1 = require("@mui/material");
var Search_1 = require("@mui/icons-material/Search");
var Close_1 = require("@mui/icons-material/Close");
var client_1 = require("../../api/client");
function DocumentSelectModal(props) {
    var open = props.open, onClose = props.onClose, onSelect = props.onSelect, title = props.title;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _a = useState(''), query = _a[0], setQuery = _a[1];
    var _b = useState(null), docs = _b[0], setDocs = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
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
                        return [4 /*yield*/, client_1.DocumentsService.documentsControllerList(50, 0)];
                    case 2:
                        data = _a.sent();
                        setDocs(data);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        console.error(e_1);
                        setError('Не удалось загрузить документы');
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
        if (open) {
            loadDocuments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    var filtered = react_1.default.useMemo(function () {
        if (!(docs === null || docs === void 0 ? void 0 : docs.items))
            return [];
        var q = query.trim().toLowerCase();
        if (!q)
            return docs.items;
        return docs.items.filter(function (d) {
            var _a, _b;
            return ((d.title || d.id || '').toLowerCase().includes(q)) ||
                ((((_a = d.scraper) === null || _a === void 0 ? void 0 : _a.name) || ((_b = d.scraper) === null || _b === void 0 ? void 0 : _b.id) || '').toLowerCase().includes(q));
        });
    }, [docs, query]);
    return (<material_1.Dialog open={open} onClose={onClose} fullWidth maxWidth="md" keepMounted>
      <material_1.DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title !== null && title !== void 0 ? title : 'Выбор документа'}</span>
        <material_1.IconButton size="small" onClick={onClose} aria-label="Закрыть">
          <Close_1.default fontSize="small"/>
        </material_1.IconButton>
      </material_1.DialogTitle>
      <material_1.DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <material_1.Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Search_1.default color="action"/>
          <material_1.TextField fullWidth size="small" placeholder="Поиск по названию или скраперу..." value={query} onChange={function (e) { return setQuery(e.target.value); }}/>
        </material_1.Box>

        {loading && (<material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <material_1.CircularProgress size={20}/>
            <material_1.Typography variant="body2">Загрузка...</material_1.Typography>
          </material_1.Box>)}
        {error && (<material_1.Typography variant="body2" color="error">{error}</material_1.Typography>)}

        {!loading && !error && (<material_1.List dense sx={{ maxHeight: 420, overflowY: 'auto', mt: 1 }}>
            {filtered.length ? (filtered.map(function (d) {
                var _a, _b, _c, _d;
                return (<material_1.ListItemButton key={d.id} onClick={function () { return onSelect(d); }}>
                  <material_1.ListItemText primary={d.title || d.id} secondary={"\u0421\u043A\u0440\u0430\u043F\u0435\u0440: ".concat((_d = (_b = (_a = d.scraper) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = d.scraper) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : '—', " \u2022 ").concat(new Date(d.scrapedAt).toLocaleString())}/>
                </material_1.ListItemButton>);
            })) : (<material_1.Box sx={{ p: 2 }}>
                <material_1.Typography variant="body2">Ничего не найдено</material_1.Typography>
              </material_1.Box>)}
          </material_1.List>)}
      </material_1.DialogContent>
      <material_1.DialogActions>
        <material_1.Button onClick={onClose}>Отмена</material_1.Button>
      </material_1.DialogActions>
    </material_1.Dialog>);
}
function DocumentSelect(_a) {
    var value = _a.value, onChange = _a.onChange, label = _a.label;
    var useState = react_1.default.useState;
    var _b = useState(false), open = _b[0], setOpen = _b[1];
    return (<material_1.Box>
      <material_1.TextField fullWidth label={label !== null && label !== void 0 ? label : 'Документ'} value={(value === null || value === void 0 ? void 0 : value.title) || ''} placeholder="Выбрать документ" InputProps={{ readOnly: true }} onClick={function () { return setOpen(true); }} sx={{ '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input::placeholder': { opacity: 1 } }}/>
      <DocumentSelectModal open={open} onClose={function () { return setOpen(false); }} onSelect={function (doc) { onChange(doc); setOpen(false); }}/>
    </material_1.Box>);
}
