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
exports.TaskSelectModal = TaskSelectModal;
exports.TaskSelect = TaskSelect;
var react_1 = require("react");
var material_1 = require("@mui/material");
var Search_1 = require("@mui/icons-material/Search");
var Close_1 = require("@mui/icons-material/Close");
var client_1 = require("../../api/client");
function apiGetTasks() {
    return __awaiter(this, arguments, void 0, function (limit, offset) {
        if (limit === void 0) { limit = 50; }
        if (offset === void 0) { offset = 0; }
        return __generator(this, function (_a) {
            return [2 /*return*/, client_1.TasksService.tasksControllerList(limit, offset)];
        });
    });
}
function apiCreateTask(payload) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, client_1.TasksService.tasksControllerCreate(payload)];
        });
    });
}
function TaskSelectModal(props) {
    var _a, _b, _c;
    var open = props.open, onClose = props.onClose, onSelect = props.onSelect, title = props.title, currentTask = props.currentTask;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var _d = useState(''), query = _d[0], setQuery = _d[1];
    var _e = useState(null), tasks = _e[0], setTasks = _e[1];
    var _f = useState(false), loading = _f[0], setLoading = _f[1];
    var _g = useState(null), error = _g[0], setError = _g[1];
    // Create or edit task state
    var _h = useState(currentTask ? 'edit' : 'create'), mode = _h[0], setMode = _h[1];
    var _j = useState(false), creating = _j[0], setCreating = _j[1];
    var _k = useState(null), createError = _k[0], setCreateError = _k[1];
    var _l = useState((_a = currentTask === null || currentTask === void 0 ? void 0 : currentTask.name) !== null && _a !== void 0 ? _a : ''), newName = _l[0], setNewName = _l[1];
    var _m = useState((_b = currentTask === null || currentTask === void 0 ? void 0 : currentTask.description) !== null && _b !== void 0 ? _b : ''), newDescription = _m[0], setNewDescription = _m[1];
    var _o = useState((_c = currentTask === null || currentTask === void 0 ? void 0 : currentTask.prompt) !== null && _c !== void 0 ? _c : ''), newPrompt = _o[0], setNewPrompt = _o[1];
    function loadTasks() {
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
                        return [4 /*yield*/, apiGetTasks(50, 0)];
                    case 2:
                        data = _a.sent();
                        setTasks(data);
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        console.error(e_1);
                        setError('Не удалось загрузить таски');
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
        var _a, _b, _c;
        if (open) {
            loadTasks();
            // sync form with currentTask when opened
            setMode(currentTask ? 'edit' : 'create');
            setNewName((_a = currentTask === null || currentTask === void 0 ? void 0 : currentTask.name) !== null && _a !== void 0 ? _a : '');
            setNewDescription((_b = currentTask === null || currentTask === void 0 ? void 0 : currentTask.description) !== null && _b !== void 0 ? _b : '');
            setNewPrompt((_c = currentTask === null || currentTask === void 0 ? void 0 : currentTask.prompt) !== null && _c !== void 0 ? _c : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);
    var filtered = react_1.default.useMemo(function () {
        if (!(tasks === null || tasks === void 0 ? void 0 : tasks.items))
            return [];
        var q = query.trim().toLowerCase();
        if (!q)
            return tasks.items;
        return tasks.items.filter(function (t) {
            return (t.name || '').toLowerCase().includes(q) ||
                (t.description || '').toLowerCase().includes(q);
        });
    }, [tasks, query]);
    function handleCreateOrUpdate() {
        return __awaiter(this, void 0, void 0, function () {
            var updated, created, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!newName.trim() || !newPrompt.trim())
                            return [2 /*return*/];
                        setCreating(true);
                        setCreateError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 7, 8]);
                        if (!(mode === 'edit' && currentTask)) return [3 /*break*/, 3];
                        return [4 /*yield*/, client_1.TasksService.tasksControllerUpdate(String(currentTask.id), {
                                name: newName.trim(),
                                description: newDescription.trim() ? newDescription : null,
                                prompt: newPrompt,
                            })];
                    case 2:
                        updated = _a.sent();
                        onSelect(updated);
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, apiCreateTask({ name: newName.trim(), description: newDescription.trim() ? newDescription : null, prompt: newPrompt })];
                    case 4:
                        created = _a.sent();
                        onSelect(created);
                        setNewName('');
                        setNewDescription('');
                        setNewPrompt('');
                        _a.label = 5;
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_2 = _a.sent();
                        console.error(e_2);
                        setCreateError(mode === 'edit' ? 'Не удалось обновить таск' : 'Не удалось создать таск');
                        return [3 /*break*/, 8];
                    case 7:
                        setCreating(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    return (<material_1.Dialog open={open} onClose={onClose} fullWidth maxWidth="md" keepMounted>
      <material_1.DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{title !== null && title !== void 0 ? title : 'Выбор таска'}</span>
        <material_1.IconButton size="small" onClick={onClose} aria-label="Закрыть">
          <Close_1.default fontSize="small"/>
        </material_1.IconButton>
      </material_1.DialogTitle>
      <material_1.DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Search and list */}
        <material_1.Box>
          <material_1.Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Search_1.default color="action"/>
            <material_1.TextField fullWidth size="small" placeholder="Поиск по названию или описанию..." value={query} onChange={function (e) { return setQuery(e.target.value); }}/>
          </material_1.Box>
          {loading && (<material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <material_1.CircularProgress size={20}/>
              <material_1.Typography variant="body2">Загрузка...</material_1.Typography>
            </material_1.Box>)}
          {error && (<material_1.Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</material_1.Typography>)}
          {!loading && !error && (<material_1.List dense sx={{ maxHeight: 300, overflowY: 'auto', mt: 1 }}>
              {filtered.length ? (filtered.map(function (t) { return (<material_1.ListItemButton key={t.id} onClick={function () { return onSelect(t); }}>
                    <material_1.ListItemText primary={t.name} secondary={(t.description ? "".concat(t.description, " \u2022 ") : '') + "ID: ".concat(t.id, " \u2022 \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D: ").concat(new Date(t.updated_at).toLocaleString())}/>
                  </material_1.ListItemButton>); })) : (<material_1.Box sx={{ p: 2 }}>
                  <material_1.Typography variant="body2">Ничего не найдено</material_1.Typography>
                </material_1.Box>)}
            </material_1.List>)}
        </material_1.Box>

        <material_1.Divider />

        {/* Create or edit task */}
        <material_1.Box>
          <material_1.Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <material_1.Typography variant="subtitle1">{mode === 'edit' ? 'Редактировать текущий таск' : 'Создать новый таск'}</material_1.Typography>
            {currentTask && (<material_1.Box sx={{ display: 'flex', gap: 1 }}>
                <material_1.Button size="small" variant={mode === 'edit' ? 'contained' : 'outlined'} onClick={function () { return setMode('edit'); }}>Редактировать</material_1.Button>
                <material_1.Button size="small" variant={mode === 'create' ? 'contained' : 'outlined'} onClick={function () { return setMode('create'); }}>Создать</material_1.Button>
              </material_1.Box>)}
          </material_1.Box>
          <material_1.Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <material_1.TextField label="Название" size="small" value={newName} onChange={function (e) { return setNewName(e.target.value); }}/>
            <material_1.TextField label="Описание (необязательно)" size="small" value={newDescription} onChange={function (e) { return setNewDescription(e.target.value); }}/>
            <material_1.TextField label="Промпт" size="small" multiline minRows={4} value={newPrompt} onChange={function (e) { return setNewPrompt(e.target.value); }}/>
            {createError && <material_1.Typography variant="body2" color="error">{createError}</material_1.Typography>}
            <material_1.Box sx={{ display: 'flex', gap: 1 }}>
              <material_1.Button variant="contained" onClick={handleCreateOrUpdate} disabled={creating || !newName.trim() || !newPrompt.trim()}>{mode === 'edit' ? 'Сохранить изменения' : 'Создать и выбрать'}</material_1.Button>
              <material_1.Button variant="text" onClick={function () { var _a, _b, _c; setNewName((_a = currentTask === null || currentTask === void 0 ? void 0 : currentTask.name) !== null && _a !== void 0 ? _a : ''); setNewDescription((_b = currentTask === null || currentTask === void 0 ? void 0 : currentTask.description) !== null && _b !== void 0 ? _b : ''); setNewPrompt((_c = currentTask === null || currentTask === void 0 ? void 0 : currentTask.prompt) !== null && _c !== void 0 ? _c : ''); }} disabled={creating}>Сбросить</material_1.Button>
            </material_1.Box>
          </material_1.Box>
        </material_1.Box>
      </material_1.DialogContent>
      <material_1.DialogActions>
        <material_1.Button onClick={onClose}>Отмена</material_1.Button>
      </material_1.DialogActions>
    </material_1.Dialog>);
}
function TaskSelect(_a) {
    var value = _a.value, onChange = _a.onChange, label = _a.label, currentTask = _a.currentTask;
    var useState = react_1.default.useState;
    var _b = useState(false), open = _b[0], setOpen = _b[1];
    return (<material_1.Box>
      <material_1.TextField fullWidth label={label !== null && label !== void 0 ? label : 'Таск'} value={(value === null || value === void 0 ? void 0 : value.name) || ''} placeholder="Выбрать таск" InputProps={{ readOnly: true }} onClick={function () { return setOpen(true); }} sx={{ '& .MuiInputBase-root': { height: 40, alignItems: 'center' }, '& .MuiInputBase-input::placeholder': { opacity: 1 } }}/>
      <TaskSelectModal open={open} onClose={function () { return setOpen(false); }} onSelect={function (task) { onChange(task); setOpen(false); }} currentTask={currentTask || null}/>
    </material_1.Box>);
}
