"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrapersService = void 0;
var OpenAPI_1 = require("../core/OpenAPI");
var request_1 = require("../core/request");
var ScrapersService = /** @class */ (function () {
    function ScrapersService() {
    }
    /**
     * @param limit
     * @param offset
     * @returns ScrapersListResponseDto_Output
     * @throws ApiError
     */
    ScrapersService.scrapersControllerList = function (limit, offset) {
        if (limit === void 0) { limit = 50; }
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/api/scrapers',
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    };
    /**
     * @param requestBody
     * @returns ScraperDto_Output
     * @throws ApiError
     */
    ScrapersService.scrapersControllerCreate = function (requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/api/scrapers',
            body: requestBody,
            mediaType: 'application/json',
        });
    };
    /**
     * @param id
     * @returns ScraperDto_Output
     * @throws ApiError
     */
    ScrapersService.scrapersControllerGetOne = function (id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/api/scrapers/{id}',
            path: {
                'id': id,
            },
        });
    };
    /**
     * @param id
     * @param requestBody
     * @returns ScraperDto_Output
     * @throws ApiError
     */
    ScrapersService.scrapersControllerUpdate = function (id, requestBody) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/api/scrapers/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    };
    /**
     * @param id
     * @returns OkResponseDto_Output
     * @throws ApiError
     */
    ScrapersService.scrapersControllerRemove = function (id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/api/scrapers/{id}',
            path: {
                'id': id,
            },
        });
    };
    /**
     * @param id
     * @returns ScraperRunResponseDto_Output
     * @throws ApiError
     */
    ScrapersService.scrapersControllerRun = function (id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/api/scrapers/{id}/run',
            path: {
                'id': id,
            },
        });
    };
    return ScrapersService;
}());
exports.ScrapersService = ScrapersService;
