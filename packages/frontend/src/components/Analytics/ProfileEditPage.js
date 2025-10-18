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
exports.ProfileEditPage = ProfileEditPage;
var react_1 = require("react");
var material_1 = require("@mui/material");
var icons_material_1 = require("@mui/icons-material");
var client_1 = require("../../api/client");
var TaskSelectModal_1 = require("../Tasks/TaskSelectModal");
var DocumentSelectModal_1 = require("../Sources/DocumentSelectModal");
function ProfileEditPage(_a) {
    var _this = this;
    var _b, _c;
    var id = _a.id, onBack = _a.onBack;
    var useState = react_1.default.useState;
    var useEffect = react_1.default.useEffect;
    var isNew = !id || id <= 0;
    var _d = useState(false), loading = _d[0], setLoading = _d[1];
    var _e = useState(false), saving = _e[0], setSaving = _e[1];
    var _f = useState(null), error = _f[0], setError = _f[1];
    var _g = useState(null), profile = _g[0], setProfile = _g[1];
    var _h = useState(''), name = _h[0], setName = _h[1];
    var _j = useState(''), description = _j[0], setDescription = _j[1];
    var _k = useState(false), running = _k[0], setRunning = _k[1];
    var _l = useState(null), runError = _l[0], setRunError = _l[1];
    // Document sources editing state (visible only for existing profiles)
    var _m = useState(false), docsLoading = _m[0], setDocsLoading = _m[1];
    var _o = useState(null), docsError = _o[0], setDocsError = _o[1];
    var _p = useState(null), sources = _p[0], setSources = _p[1];
    var _q = useState({}), docsMap = _q[0], setDocsMap = _q[1];
    var _r = useState(null), newDoc = _r[0], setNewDoc = _r[1];
    // Task selection state
    var _s = useState(false), taskAssigning = _s[0], setTaskAssigning = _s[1];
    var _t = useState(null), taskError = _t[0], setTaskError = _t[1];
    var _u = useState(null), newTask = _u[0], setNewTask = _u[1];
    var _v = useState(null), currentTaskId = _v[0], setCurrentTaskId = _v[1];
    var _w = useState(null), currentTask = _w[0], setCurrentTask = _w[1];
    function load() {
        return __awaiter(this, void 0, void 0, function () {
            var p, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (isNew || !id)
                            return [2 /*return*/];
                        setLoading(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerGetOne(String(id))];
                    case 2:
                        p = _a.sent();
                        setProfile(p);
                        setName(p.name || '');
                        setDescription(p.description
                            ? typeof p.description === 'string'
                                ? p.description
                                : JSON.stringify(p.description)
                            : '');
                        return [4 /*yield*/, loadSources(String(id))];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, loadTask(String(id))];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        e_1 = _a.sent();
                        console.error(e_1);
                        setError('Не удалось загрузить профиль');
                        return [3 /*break*/, 7];
                    case 6:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    useEffect(function () {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    function loadSources(profileId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, items, missing, fetched, toMerge_1, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setDocsLoading(true);
                        setDocsError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerListSources(profileId)];
                    case 2:
                        data = _a.sent();
                        setSources(data);
                        items = Array.isArray(data === null || data === void 0 ? void 0 : data.items) ? data.items : [];
                        missing = items.filter(function (s) { return !docsMap[s.documentId]; });
                        if (!missing.length) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.allSettled(missing.map(function (s) {
                                return client_1.DocumentsService.documentsControllerGetOne(s.documentId);
                            }))];
                    case 3:
                        fetched = _a.sent();
                        toMerge_1 = {};
                        fetched.forEach(function (r) {
                            if (r.status === 'fulfilled') {
                                var d = r.value;
                                if (d && d.id)
                                    toMerge_1[d.id] = d;
                            }
                        });
                        if (Object.keys(toMerge_1).length) {
                            setDocsMap(function (prev) { return (__assign(__assign({}, prev), toMerge_1)); });
                        }
                        _a.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_2 = _a.sent();
                        console.error(e_2);
                        setDocsError('Не удалось загрузить документы профиля');
                        return [3 /*break*/, 7];
                    case 6:
                        setDocsLoading(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function assignDoc() {
        return __awaiter(this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || !newDoc)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerAssignSource(String(id), {
                                documentId: newDoc.id,
                            })];
                    case 2:
                        _a.sent();
                        setNewDoc(null);
                        return [4 /*yield*/, loadSources(String(id))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_3 = _a.sent();
                        console.error(e_3);
                        setDocsError('Не удалось добавить документ');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function unassignDoc(documentId) {
        return __awaiter(this, void 0, void 0, function () {
            var e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerUnassignSource(String(id), documentId)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, loadSources(String(id))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_4 = _a.sent();
                        console.error(e_4);
                        setDocsError('Не удалось удалить документ из профиля');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function openReports() {
        if (!id)
            return;
        var nameParam = encodeURIComponent(name || (profile === null || profile === void 0 ? void 0 : profile.name) || '');
        window.location.hash = "#/reports/".concat(id, "?name=").concat(nameParam);
    }
    function runProfile() {
        return __awaiter(this, void 0, void 0, function () {
            var e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id)
                            return [2 /*return*/];
                        if (!confirm('Запустить анализ профиля?'))
                            return [2 /*return*/];
                        setRunError(null);
                        setRunning(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerRunAggregate(String(id))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        e_5 = _a.sent();
                        console.error(e_5);
                        setRunError('Не удалось запустить анализ');
                        return [3 /*break*/, 5];
                    case 4:
                        setRunning(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function save() {
        return __awaiter(this, void 0, void 0, function () {
            var payload, payload, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!name.trim())
                            return [2 /*return*/];
                        setSaving(true);
                        setError(null);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 7, 8]);
                        if (!isNew) return [3 /*break*/, 3];
                        payload = {
                            name: name,
                            description: description.trim() ? description : null,
                        };
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerCreate(payload)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        payload = {
                            name: name,
                            description: description.trim() ? description : null,
                        };
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerUpdate(String(id), payload)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        onBack();
                        return [3 /*break*/, 8];
                    case 6:
                        e_6 = _a.sent();
                        console.error(e_6);
                        setError('Не удалось сохранить профиль');
                        return [3 /*break*/, 8];
                    case 7:
                        setSaving(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    function loadTask(profileId) {
        return __awaiter(this, void 0, void 0, function () {
            var t, full, e_7, e_8;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerGetTask(profileId)];
                    case 1:
                        t = _b.sent();
                        setCurrentTaskId((_a = t === null || t === void 0 ? void 0 : t.taskId) !== null && _a !== void 0 ? _a : null);
                        if (!((t === null || t === void 0 ? void 0 : t.taskId) != null)) return [3 /*break*/, 6];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, client_1.TasksService.tasksControllerGetOne(String(t.taskId))];
                    case 3:
                        full = _b.sent();
                        setCurrentTask(full);
                        return [3 /*break*/, 5];
                    case 4:
                        e_7 = _b.sent();
                        console.warn('Не удалось загрузить детали таска', e_7);
                        setCurrentTask(null);
                        return [3 /*break*/, 5];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        setCurrentTask(null);
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        e_8 = _b.sent();
                        console.error(e_8);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    function assignTask() {
        return __awaiter(this, void 0, void 0, function () {
            var e_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || !newTask)
                            return [2 /*return*/];
                        setTaskError(null);
                        setTaskAssigning(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, client_1.ProfilesService.profileControllerAssignTask(String(id), {
                                taskId: newTask.id,
                            })];
                    case 2:
                        _a.sent();
                        setNewTask(null);
                        return [4 /*yield*/, loadTask(String(id))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        e_9 = _a.sent();
                        console.error(e_9);
                        setTaskError('Не удалось назначить таск');
                        return [3 /*break*/, 6];
                    case 5:
                        setTaskAssigning(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
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
            ? 'Создать профиль'
            : "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C".concat(profile ? ": ".concat(profile.name) : '')}
        </material_1.Typography>
      </material_1.Box>

      {loading && <material_1.Typography variant="body2">Загрузка...</material_1.Typography>}
      {error && (<material_1.Typography variant="body2" color="error">
          {error}
        </material_1.Typography>)}

      <material_1.Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 640 }}>
        <material_1.TextField label="Название" value={name} onChange={function (e) { return setName(e.target.value); }} fullWidth autoFocus onKeyDown={function (e) {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!saving && name.trim())
                    save();
            }
        }} helperText="Ctrl/Cmd+Enter — сохранить"/>
        <material_1.TextField label="Описание" value={description} onChange={function (e) { return setDescription(e.target.value); }} fullWidth multiline minRows={6}/>
        <material_1.Box sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
        }}>
          <material_1.Button variant="contained" startIcon={<icons_material_1.Save />} onClick={save} disabled={saving || !name.trim()}>
            Сохранить
          </material_1.Button>
          {!isNew && (<>
              <material_1.Button variant="outlined" startIcon={<icons_material_1.Article />} onClick={openReports}>
                Репорты
              </material_1.Button>
              <material_1.Button variant="outlined" color="success" startIcon={<icons_material_1.PlayArrow />} onClick={runProfile} disabled={running} title="Запустить анализ">
                {running ? 'Запуск...' : 'Запустить'}
              </material_1.Button>
            </>)}
        </material_1.Box>
        {!isNew && runError && (<material_1.Typography variant="body2" color="error">
            {runError}
          </material_1.Typography>)}
      </material_1.Box>

      {!isNew && (<>
          <material_1.Divider sx={{ my: 3 }}/>
          <material_1.Typography variant="h6" sx={{ mb: 1 }}>
            Таск профиля
          </material_1.Typography>
          {/* Current task display */}
          <material_1.Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                maxWidth: 640,
                mb: 1,
            }}>
            {currentTaskId ? (<material_1.Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    border: '1px solid #eee',
                    borderRadius: 1,
                }}>
                <material_1.Box>
                  <material_1.Typography variant="subtitle2">Назначен таск</material_1.Typography>
                  <material_1.Typography variant="body2">
                    {(_b = currentTask === null || currentTask === void 0 ? void 0 : currentTask.name) !== null && _b !== void 0 ? _b : "ID: ".concat(currentTaskId)}
                  </material_1.Typography>
                  {(currentTask === null || currentTask === void 0 ? void 0 : currentTask.updated_at) && (<material_1.Typography variant="caption" color="text.secondary">
                      Обновлен:{' '}
                      {new Date(currentTask.updated_at).toLocaleString()}
                    </material_1.Typography>)}
                </material_1.Box>
                <material_1.Button variant="text" color="error" onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                    var e_10;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!id)
                                    return [2 /*return*/];
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, client_1.ProfilesService.profileControllerUnassignTask(String(id))];
                            case 2:
                                _a.sent();
                                setCurrentTaskId(null);
                                setCurrentTask(null);
                                return [3 /*break*/, 4];
                            case 3:
                                e_10 = _a.sent();
                                console.error(e_10);
                                setTaskError('Не удалось убрать таск');
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); }}>
                  Убрать
                </material_1.Button>
              </material_1.Box>) : (<material_1.Typography variant="body2">Таск не назначен</material_1.Typography>)}
          </material_1.Box>
          {/* Selection */}
          <material_1.Box sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-end',
                maxWidth: 640,
                mb: 1,
            }}>
            <material_1.Box sx={{ flex: 1 }}>
              <TaskSelectModal_1.TaskSelect value={newTask} onChange={setNewTask} label="Выбрать таск" currentTask={currentTask}/>
            </material_1.Box>
            <material_1.Button variant="contained" onClick={assignTask} disabled={!newTask || taskAssigning}>
              {taskAssigning ? 'Назначение...' : 'Назначить'}
            </material_1.Button>
          </material_1.Box>
          {taskError && (<material_1.Typography variant="body2" color="error">
              {taskError}
            </material_1.Typography>)}

          <material_1.Divider sx={{ my: 3 }}/>
          <material_1.Typography variant="h6" sx={{ mb: 1 }}>
            Документы профиля
          </material_1.Typography>
          <material_1.Box sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-end',
                maxWidth: 640,
                mb: 1,
            }}>
            <material_1.Box sx={{ flex: 1 }}>
              <DocumentSelectModal_1.DocumentSelect value={newDoc} onChange={setNewDoc} label="Добавить документ"/>
            </material_1.Box>
            <material_1.Button variant="contained" onClick={assignDoc} disabled={!newDoc}>
              Добавить
            </material_1.Button>
          </material_1.Box>
          {docsLoading && <material_1.Typography variant="body2">Загрузка...</material_1.Typography>}
          {docsError && (<material_1.Typography variant="body2" color="error">
              {docsError}
            </material_1.Typography>)}
          <material_1.List dense sx={{ maxWidth: 800 }}>
            {((_c = sources === null || sources === void 0 ? void 0 : sources.items) === null || _c === void 0 ? void 0 : _c.length)
                ? sources.items.map(function (s) {
                    var _a, _b, _c, _d;
                    var d = docsMap[s.documentId];
                    return (<material_1.ListItem key={s.id} divider secondaryAction={<material_1.IconButton edge="end" aria-label="remove" onClick={function () { return unassignDoc(s.documentId); }} title="Убрать">
                          <icons_material_1.Delete />
                        </material_1.IconButton>}>
                      <material_1.ListItemText primary={d ? d.title || d.id : "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 ".concat(s.documentId)} secondary={d
                            ? "\u0421\u043A\u0440\u0430\u043F\u0435\u0440: ".concat((_d = (_b = (_a = d.scraper) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = d.scraper) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : '—', " \u2022 \u0418\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u043E: ").concat(new Date(d.scrapedAt).toLocaleString())
                            : 'Загрузка деталей...'}/>
                    </material_1.ListItem>);
                })
                : !docsLoading && (<material_1.Typography variant="body2">Документы не выбраны</material_1.Typography>)}
          </material_1.List>
        </>)}
    </material_1.Box>);
}
