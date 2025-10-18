/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportCreateDto } from '../models/ReportCreateDto';
import type { ReportDto } from '../models/ReportDto';
import type { ReportsListResponseDto } from '../models/ReportsListResponseDto';
import type { ReportUpdateDto } from '../models/ReportUpdateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReportsService {
    /**
     * @param limit Limit
     * @param offset Offset
     * @param profileId Filter by profile id
     * @param kind Filter by kind
     * @returns ReportsListResponseDto List reports with pagination
     * @throws ApiError
     */
    public static reportControllerList(
        limit?: number,
        offset?: number,
        profileId?: number,
        kind?: string,
    ): CancelablePromise<ReportsListResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports',
            query: {
                'limit': limit,
                'offset': offset,
                'profile_id': profileId,
                'kind': kind,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ReportDto Created report
     * @throws ApiError
     */
    public static reportControllerCreate(
        requestBody: ReportCreateDto,
    ): CancelablePromise<ReportDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ReportDto Report by id
     * @throws ApiError
     */
    public static reportControllerGetOne(
        id: string,
    ): CancelablePromise<ReportDto> {
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
     * @returns ReportDto Updated report
     * @throws ApiError
     */
    public static reportControllerUpdate(
        id: string,
        requestBody: ReportUpdateDto,
    ): CancelablePromise<ReportDto> {
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
     * @returns any Delete result
     * @throws ApiError
     */
    public static reportControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports/{id}',
            path: {
                'id': id,
            },
        });
    }
}
