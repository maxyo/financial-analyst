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
exports.ReportsPage = ReportsPage;
var react_1 = require("react");
var material_1 = require("@mui/material");
var icons_material_1 = require("@mui/icons-material");
var client_1 = require("../../api/client");
function ReportsPage(_a) {
    var _b;
    var profileId = _a.profileId, profileName = _a.profileName, onBack = _a.onBack;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    var _e = useState(null), data = _e[0], setData = _e[1];
    var _f = useState(null), selected = _f[0], setSelected = _f[1];
    var _g = useState(false), modalOpen = _g[0], setModalOpen = _g[1];
    var _h = useState(null), removingId = _h[0], setRemovingId = _h[1];
    function load() {
        return __awaiter(this, void 0, void 0, function () {
            var resp, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, client_1.ReportsService.reportControllerList(undefined, undefined, profileId, undefined)];
                    case 2:
                        resp = _a.sent();
                        setData(resp);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        console.error(e_1);
                        setError('Не удалось загрузить репорты');
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
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileId]);
    function openReport(r) {
        setSelected(r);
        setModalOpen(true);
    }
    function closeReport() {
        setModalOpen(false);
        setSelected(null);
    }
    function removeReport(id) {
        return __awaiter(this, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!confirm('Удалить репорт?'))
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        setRemovingId(id);
                        return [4 /*yield*/, client_1.ReportsService.reportControllerRemove(id)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, load()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        e_2 = _a.sent();
                        console.error(e_2);
                        setError('Не удалось удалить репорт');
                        return [3 /*break*/, 6];
                    case 5:
                        setRemovingId(null);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    return (<material_1.Box>
      <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <material_1.Button startIcon={<icons_material_1.ArrowBack />} onClick={onBack}>Назад</material_1.Button>
        <material_1.Typography variant="h6">Репорты профиля{profileName ? ": ".concat(profileName) : ''}</material_1.Typography>
      </material_1.Box>

      {loading && <material_1.Typography variant="body2">Загрузка...</material_1.Typography>}
      {error && <material_1.Typography variant="body2" color="error">{error}</material_1.Typography>}

      <material_1.List dense>
        {((_b = data === null || data === void 0 ? void 0 : data.items) === null || _b === void 0 ? void 0 : _b.length) ? data.items.map(function (r) { return (<material_1.ListItem key={r.id} divider secondaryAction={<material_1.Box>
              <material_1.IconButton edge="end" aria-label="open" title="Открыть" onClick={function () { return openReport(r); }}>
                <icons_material_1.OpenInNew />
              </material_1.IconButton>
              <material_1.IconButton edge="end" aria-label="delete" title="Удалить" onClick={function () { return removeReport(r.id); }} disabled={removingId === r.id}>
                <icons_material_1.Delete />
              </material_1.IconButton>
            </material_1.Box>}>
            <material_1.ListItemText primary={"".concat(r.kind || 'default', " \u2022 ").concat(new Date(r.created_at).toLocaleString())} secondary={r.content ? JSON.stringify(r.content).slice(0, 160) + (JSON.stringify(r.content).length > 160 ? '…' : '') : 'Нет содержимого'}/>
          </material_1.ListItem>); }) : (!loading && <material_1.Typography variant="body2">Репорты отсутствуют</material_1.Typography>)}
      </material_1.List>

      <material_1.Dialog open={modalOpen} onClose={closeReport} fullWidth maxWidth="md">
        <material_1.DialogTitle>Репорт</material_1.DialogTitle>
        <material_1.DialogContent>
          {selected ? (<material_1.Box>
              <material_1.Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                <material_1.Chip label={selected.kind || 'default'} size="small"/>
                <material_1.Chip label={new Date(selected.created_at).toLocaleString()} size="small"/>
                <material_1.Chip label={"ID: ".concat(selected.id)} size="small" variant="outlined"/>
                <material_1.Chip label={"Profile: ".concat(selected.profile_id)} size="small" variant="outlined"/>
              </material_1.Stack>

              <material_1.Divider sx={{ my: 1 }}/>

              <material_1.Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <material_1.Box>
                  <material_1.Typography variant="subtitle2" gutterBottom>Содержимое</material_1.Typography>
                  <material_1.Box component="pre" sx={{ m: 0, p: 1, bgcolor: function (theme) { return theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100'; }, color: function (theme) { return theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit'; }, border: function (theme) { return "1px solid ".concat(theme.palette.divider); }, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12 }}>
                    {selected.content ? JSON.stringify(selected.content, null, 2) : 'Нет содержимого'}
                  </material_1.Box>
                </material_1.Box>
                <material_1.Box>
                  <material_1.Typography variant="subtitle2" gutterBottom>Метаданные</material_1.Typography>
                  <material_1.Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 0.5, columnGap: 1, alignItems: 'start' }}>
                    <material_1.Typography variant="caption" color="text.secondary">Job</material_1.Typography>
                    <material_1.Box component="pre" sx={{ m: 0, p: 1, bgcolor: function (theme) { return theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100'; }, color: function (theme) { return theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit'; }, border: function (theme) { return "1px solid ".concat(theme.palette.divider); }, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12 }}>
                      {selected.job_id ? JSON.stringify(selected.job_id, null, 2) : '—'}
                    </material_1.Box>
                    <material_1.Typography variant="caption" color="text.secondary">LLM</material_1.Typography>
                    <material_1.Box component="pre" sx={{ m: 0, p: 1, bgcolor: function (theme) { return theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100'; }, color: function (theme) { return theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit'; }, border: function (theme) { return "1px solid ".concat(theme.palette.divider); }, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12 }}>
                      {selected.llmModel ? JSON.stringify(selected.llmModel, null, 2) : '—'}
                    </material_1.Box>
                    <material_1.Typography variant="caption" color="text.secondary">Confidence</material_1.Typography>
                    <material_1.Box component="pre" sx={{ m: 0, p: 1, bgcolor: function (theme) { return theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100'; }, color: function (theme) { return theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit'; }, border: function (theme) { return "1px solid ".concat(theme.palette.divider); }, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12 }}>
                      {selected.confidence ? JSON.stringify(selected.confidence, null, 2) : '—'}
                    </material_1.Box>
                    <material_1.Typography variant="caption" color="text.secondary">Relevance</material_1.Typography>
                    <material_1.Box component="pre" sx={{ m: 0, p: 1, bgcolor: function (theme) { return theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100'; }, color: function (theme) { return theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit'; }, border: function (theme) { return "1px solid ".concat(theme.palette.divider); }, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12 }}>
                      {selected.relevance ? JSON.stringify(selected.relevance, null, 2) : '—'}
                    </material_1.Box>
                    <material_1.Typography variant="caption" color="text.secondary">Tokens in</material_1.Typography>
                    <material_1.Box component="pre" sx={{ m: 0, p: 1, bgcolor: function (theme) { return theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100'; }, color: function (theme) { return theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit'; }, border: function (theme) { return "1px solid ".concat(theme.palette.divider); }, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12 }}>
                      {selected.tokens_in ? JSON.stringify(selected.tokens_in, null, 2) : '—'}
                    </material_1.Box>
                    <material_1.Typography variant="caption" color="text.secondary">Tokens out</material_1.Typography>
                    <material_1.Box component="pre" sx={{ m: 0, p: 1, bgcolor: function (theme) { return theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100'; }, color: function (theme) { return theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit'; }, border: function (theme) { return "1px solid ".concat(theme.palette.divider); }, borderRadius: 1, whiteSpace: 'break-word', fontFamily: 'monospace', fontSize: 12 }}>
                      {selected.tokens_out ? JSON.stringify(selected.tokens_out, null, 2) : '—'}
                    </material_1.Box>
                    <material_1.Typography variant="caption" color="text.secondary">Стоимость</material_1.Typography>
                    <material_1.Box component="pre" sx={{ m: 0, p: 1, bgcolor: function (theme) { return theme.palette.mode === 'dark' ? '#0b1220' : 'grey.100'; }, color: function (theme) { return theme.palette.mode === 'dark' ? theme.palette.grey[100] : 'inherit'; }, border: function (theme) { return "1px solid ".concat(theme.palette.divider); }, borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: 12 }}>
                      {selected.cost ? JSON.stringify(selected.cost, null, 2) : '—'}
                    </material_1.Box>
                  </material_1.Box>
                </material_1.Box>
              </material_1.Box>
            </material_1.Box>) : null}
        </material_1.DialogContent>
        <material_1.DialogActions>
          <material_1.Button onClick={closeReport}>Закрыть</material_1.Button>
        </material_1.DialogActions>
      </material_1.Dialog>
    </material_1.Box>);
}
