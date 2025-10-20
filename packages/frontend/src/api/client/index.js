"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = exports.ScrapersService = exports.ReportsService = exports.ProfilesService = exports.DocumentsService = exports.DefaultService = exports.CollectionsService = exports.ReportUpdateDto = exports.ReportCreateDto = exports.DocumentUpdateDto = exports.DocumentDto_Output = exports.OpenAPI = exports.CancelError = exports.CancelablePromise = exports.ApiError = void 0;
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
var ApiError_1 = require("./core/ApiError");
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return ApiError_1.ApiError; } });
var CancelablePromise_1 = require("./core/CancelablePromise");
Object.defineProperty(exports, "CancelablePromise", { enumerable: true, get: function () { return CancelablePromise_1.CancelablePromise; } });
Object.defineProperty(exports, "CancelError", { enumerable: true, get: function () { return CancelablePromise_1.CancelError; } });
var OpenAPI_1 = require("./core/OpenAPI");
Object.defineProperty(exports, "OpenAPI", { enumerable: true, get: function () { return OpenAPI_1.OpenAPI; } });
var DocumentDto_Output_1 = require("./models/DocumentDto_Output");
Object.defineProperty(exports, "DocumentDto_Output", { enumerable: true, get: function () { return DocumentDto_Output_1.DocumentDto_Output; } });
var DocumentUpdateDto_1 = require("./models/DocumentUpdateDto");
Object.defineProperty(exports, "DocumentUpdateDto", { enumerable: true, get: function () { return DocumentUpdateDto_1.DocumentUpdateDto; } });
var ReportCreateDto_1 = require("./models/ReportCreateDto");
Object.defineProperty(exports, "ReportCreateDto", { enumerable: true, get: function () { return ReportCreateDto_1.ReportCreateDto; } });
var ReportUpdateDto_1 = require("./models/ReportUpdateDto");
Object.defineProperty(exports, "ReportUpdateDto", { enumerable: true, get: function () { return ReportUpdateDto_1.ReportUpdateDto; } });
var CollectionsService_1 = require("./services/CollectionsService");
Object.defineProperty(exports, "CollectionsService", { enumerable: true, get: function () { return CollectionsService_1.CollectionsService; } });
var DefaultService_1 = require("./services/DefaultService");
Object.defineProperty(exports, "DefaultService", { enumerable: true, get: function () { return DefaultService_1.DefaultService; } });
var DocumentsService_1 = require("./services/DocumentsService");
Object.defineProperty(exports, "DocumentsService", { enumerable: true, get: function () { return DocumentsService_1.DocumentsService; } });
var ProfilesService_1 = require("./services/ProfilesService");
Object.defineProperty(exports, "ProfilesService", { enumerable: true, get: function () { return ProfilesService_1.ProfilesService; } });
var ReportsService_1 = require("./services/ReportsService");
Object.defineProperty(exports, "ReportsService", { enumerable: true, get: function () { return ReportsService_1.ReportsService; } });
var ScrapersService_1 = require("./services/ScrapersService");
Object.defineProperty(exports, "ScrapersService", { enumerable: true, get: function () { return ScrapersService_1.ScrapersService; } });
var TasksService_1 = require("./services/TasksService");
Object.defineProperty(exports, "TasksService", { enumerable: true, get: function () { return TasksService_1.TasksService; } });
