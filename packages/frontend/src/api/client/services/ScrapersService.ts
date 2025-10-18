/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OkResponseDto_Output } from '../models/OkResponseDto_Output';
import type { ScraperCreateDto } from '../models/ScraperCreateDto';
import type { ScraperDto_Output } from '../models/ScraperDto_Output';
import type { ScraperRunResponseDto_Output } from '../models/ScraperRunResponseDto_Output';
import type { ScrapersListResponseDto_Output } from '../models/ScrapersListResponseDto_Output';
import type { ScraperUpdateDto } from '../models/ScraperUpdateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ScrapersService {
    /**
     * @param limit
     * @param offset
     * @returns ScrapersListResponseDto_Output
     * @throws ApiError
     */
    public static scrapersControllerList(
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<ScrapersListResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/scrapers',
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ScraperDto_Output
     * @throws ApiError
     */
    public static scrapersControllerCreate(
        requestBody: ScraperCreateDto,
    ): CancelablePromise<ScraperDto_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/scrapers',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ScraperDto_Output
     * @throws ApiError
     */
    public static scrapersControllerGetOne(
        id: string,
    ): CancelablePromise<ScraperDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/scrapers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ScraperDto_Output
     * @throws ApiError
     */
    public static scrapersControllerUpdate(
        id: string,
        requestBody: ScraperUpdateDto,
    ): CancelablePromise<ScraperDto_Output> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/scrapers/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns OkResponseDto_Output
     * @throws ApiError
     */
    public static scrapersControllerRemove(
        id: string,
    ): CancelablePromise<OkResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/scrapers/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns ScraperRunResponseDto_Output
     * @throws ApiError
     */
    public static scrapersControllerRun(
        id: string,
    ): CancelablePromise<ScraperRunResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/scrapers/{id}/run',
            path: {
                'id': id,
            },
        });
    }
}
