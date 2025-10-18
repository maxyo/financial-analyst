/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScraperCreateDto } from '../models/ScraperCreateDto';
import type { ScraperDto } from '../models/ScraperDto';
import type { ScrapersListResponseDto } from '../models/ScrapersListResponseDto';
import type { ScraperUpdateDto } from '../models/ScraperUpdateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ScrapersService {
    /**
     * @param limit Limit
     * @param offset Offset
     * @returns ScrapersListResponseDto List of scrapers with pagination
     * @throws ApiError
     */
    public static scrapersControllerList(
        limit?: number,
        offset?: number,
    ): CancelablePromise<ScrapersListResponseDto> {
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
     * @returns ScraperDto Created scraper
     * @throws ApiError
     */
    public static scrapersControllerCreate(
        requestBody: ScraperCreateDto,
    ): CancelablePromise<ScraperDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/scrapers',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ScraperDto Scraper by id
     * @throws ApiError
     */
    public static scrapersControllerGetOne(
        id: string,
    ): CancelablePromise<ScraperDto> {
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
     * @returns ScraperDto Updated scraper
     * @throws ApiError
     */
    public static scrapersControllerUpdate(
        id: string,
        requestBody: ScraperUpdateDto,
    ): CancelablePromise<ScraperDto> {
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
     * @returns any Delete result
     * @throws ApiError
     */
    public static scrapersControllerRemove(
        id: string,
    ): CancelablePromise<any> {
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
     * @returns any Enqueue scraping job for the scraper by id
     * @throws ApiError
     */
    public static scrapersControllerRun(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/scrapers/{id}/run',
            path: {
                'id': id,
            },
        });
    }
}
