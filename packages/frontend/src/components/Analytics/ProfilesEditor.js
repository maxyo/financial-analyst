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
exports.ProfilesEditor = ProfilesEditor;
var react_1 = require("react");
var material_1 = require("@mui/material");
var icons_material_1 = require("@mui/icons-material");
var client_1 = require("../../api/client");
function ProfilesEditor() {
    var _a;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _b = useState(null), list = _b[0], setList = _b[1];
    var _c = useState(''), filter = _c[0], setFilter = _c[1];
    var _d = useState(false), loading = _d[0], setLoading = _d[1];
    var _e = useState(null), error = _e[0], setError = _e[1];
    // Simplified: separate edit page; list page only navigates to edit and delete
    function load() {
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
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerList()];
                    case 2:
                        data = _a.sent();
                        setList(data);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        console.error(e_1);
                        setError('Не удалось загрузить список профилей');
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
    }, []);
    function remove(id) {
        return __awaiter(this, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!confirm('Удалить профиль?'))
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerRemove(String(id))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, load()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_2 = _a.sent();
                        console.error(e_2);
                        setError('Не удалось удалить профиль');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    return (<material_1.Box>
      <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <material_1.Button variant="contained" startIcon={<icons_material_1.Add />} onClick={function () { window.location.hash = '#/profile/new'; }}>Добавить профиль</material_1.Button>
        <material_1.TextField size="small" placeholder="Поиск по названию" value={filter} onChange={function (e) { return setFilter(e.target.value); }} sx={{ minWidth: 240 }}/>
        {loading && <material_1.Typography variant="body2">Загрузка...</material_1.Typography>}
        {error && <material_1.Typography variant="body2" color="error">{error}</material_1.Typography>}
      </material_1.Box>

      <material_1.List dense>
        {((_a = list === null || list === void 0 ? void 0 : list.items) === null || _a === void 0 ? void 0 : _a.length) ? (list.items.filter(function (p) { return !filter.trim() || (p.name || '').toLowerCase().includes(filter.toLowerCase()); }).map(function (p) { return (<material_1.ListItem key={p.id} divider button onClick={function () { window.location.hash = "#/profile/".concat(p.id); }} secondaryAction={<material_1.Box>
                <material_1.IconButton edge="end" aria-label="delete" onClick={function (e) { e.stopPropagation(); remove(p.id); }} title="Удалить"><icons_material_1.Delete /></material_1.IconButton>
              </material_1.Box>}>
              <material_1.ListItemText primary={p.name} secondary={"".concat(p.description ? (typeof p.description === 'string' ? p.description : JSON.stringify(p.description)) + ' • ' : '', "ID: ").concat(p.id, " \u2022 \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D: ").concat(new Date(p.updated_at).toLocaleString())}/>
            </material_1.ListItem>); })) : (!loading && (<material_1.Box sx={{ p: 2, textAlign: 'center' }}>
              <material_1.Typography variant="body2" sx={{ mb: 1 }}>Профили отсутствуют</material_1.Typography>
              <material_1.Button variant="outlined" startIcon={<icons_material_1.Add />} onClick={function () { window.location.hash = '#/profile/new'; }}>Создать первый профиль</material_1.Button>
            </material_1.Box>))}
      </material_1.List>
    </material_1.Box>);
}
