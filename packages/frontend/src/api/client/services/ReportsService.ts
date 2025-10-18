/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OkResponseDto_Output } from '../models/OkResponseDto_Output';
import type { ReportCreateDto } from '../models/ReportCreateDto';
import type { ReportDto_Output } from '../models/ReportDto_Output';
import type { ReportsListResponseDto_Output } from '../models/ReportsListResponseDto_Output';
import type { ReportUpdateDto } from '../models/ReportUpdateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportsService {
    /**
     * @param limit
     * @param offset
     * @param profileId
     * @returns ReportsListResponseDto_Output
     * @throws ApiError
     */
    public static reportControllerList(
        limit: number = 50,
        offset?: number,
        profileId?: number,
    ): CancelablePromise<ReportsListResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports',
            query: {
                'limit': limit,
                'offset': offset,
                'profile_id': profileId,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ReportDto_Output
     * @throws ApiError
     */
    public static reportControllerCreate(
        requestBody: ReportCreateDto,
    ): CancelablePromise<ReportDto_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ReportDto_Output
     * @throws ApiError
     */
    public static reportControllerGetOne(
        id: string,
    ): CancelablePromise<ReportDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ReportDto_Output
     * @throws ApiError
     */
    public static reportControllerUpdate(
        id: string,
        requestBody: ReportUpdateDto,
    ): CancelablePromise<ReportDto_Output> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/reports/{id}',
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
    public static reportControllerRemove(
        id: string,
    ): CancelablePromise<OkResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports/{id}',
            path: {
                'id': id,
            },
        });
    }
}
