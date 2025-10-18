"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = exports.ScrapersService = exports.ReportsService = exports.ProfilesService = exports.JobsService = exports.DocumentsService = exports.DefaultService = exports.CollectionsService = exports.ScraperUpdateDto = exports.ScraperDto = exports.ScraperCreateDto = exports.ReportUpdateDto = exports.ReportDto = exports.ReportCreateDto = exports.OpenAPI = exports.CancelError = exports.CancelablePromise = exports.ApiError = void 0;
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
var ReportCreateDto_1 = require("./models/ReportCreateDto");
Object.defineProperty(exports, "ReportCreateDto", { enumerable: true, get: function () { return ReportCreateDto_1.ReportCreateDto; } });
var ReportDto_1 = require("./models/ReportDto");
Object.defineProperty(exports, "ReportDto", { enumerable: true, get: function () { return ReportDto_1.ReportDto; } });
var ReportUpdateDto_1 = require("./models/ReportUpdateDto");
Object.defineProperty(exports, "ReportUpdateDto", { enumerable: true, get: function () { return ReportUpdateDto_1.ReportUpdateDto; } });
var ScraperCreateDto_1 = require("./models/ScraperCreateDto");
Object.defineProperty(exports, "ScraperCreateDto", { enumerable: true, get: function () { return ScraperCreateDto_1.ScraperCreateDto; } });
var ScraperDto_1 = require("./models/ScraperDto");
Object.defineProperty(exports, "ScraperDto", { enumerable: true, get: function () { return ScraperDto_1.ScraperDto; } });
var ScraperUpdateDto_1 = require("./models/ScraperUpdateDto");
Object.defineProperty(exports, "ScraperUpdateDto", { enumerable: true, get: function () { return ScraperUpdateDto_1.ScraperUpdateDto; } });
var CollectionsService_1 = require("./services/CollectionsService");
Object.defineProperty(exports, "CollectionsService", { enumerable: true, get: function () { return CollectionsService_1.CollectionsService; } });
var DefaultService_1 = require("./services/DefaultService");
Object.defineProperty(exports, "DefaultService", { enumerable: true, get: function () { return DefaultService_1.DefaultService; } });
var DocumentsService_1 = require("./services/DocumentsService");
Object.defineProperty(exports, "DocumentsService", { enumerable: true, get: function () { return DocumentsService_1.DocumentsService; } });
var JobsService_1 = require("./services/JobsService");
Object.defineProperty(exports, "JobsService", { enumerable: true, get: function () { return JobsService_1.JobsService; } });
var ProfilesService_1 = require("./services/ProfilesService");
Object.defineProperty(exports, "ProfilesService", { enumerable: true, get: function () { return ProfilesService_1.ProfilesService; } });
var ReportsService_1 = require("./services/ReportsService");
Object.defineProperty(exports, "ReportsService", { enumerable: true, get: function () { return ReportsService_1.ReportsService; } });
var ScrapersService_1 = require("./services/ScrapersService");
Object.defineProperty(exports, "ScrapersService", { enumerable: true, get: function () { return ScrapersService_1.ScrapersService; } });
var TasksService_1 = require("./services/TasksService");
Object.defineProperty(exports, "TasksService", { enumerable: true, get: function () { return TasksService_1.TasksService; } });
