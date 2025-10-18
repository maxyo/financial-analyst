/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentCreateDto } from '../models/DocumentCreateDto';
import type { DocumentDto_Output } from '../models/DocumentDto_Output';
import type { DocumentsListResponseDto_Output } from '../models/DocumentsListResponseDto_Output';
import type { DocumentUpdateDto } from '../models/DocumentUpdateDto';
import type { OkResponseDto_Output } from '../models/OkResponseDto_Output';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DocumentsService {
    /**
     * @param limit
     * @param offset
     * @param title
     * @param q
     * @param scraperId
     * @param dateFrom
     * @param dateTo
     * @returns DocumentsListResponseDto_Output
     * @throws ApiError
     */
    public static documentsControllerList(
        limit: number = 50,
        offset?: number,
        title?: string,
        q?: string,
        scraperId?: string,
        dateFrom?: string,
        dateTo?: string,
    ): CancelablePromise<DocumentsListResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/documents',
            query: {
                'limit': limit,
                'offset': offset,
                'title': title,
                'q': q,
                'scraperId': scraperId,
                'dateFrom': dateFrom,
                'dateTo': dateTo,
            },
        });
    }
    /**
     * @param requestBody
     * @returns DocumentDto_Output
     * @throws ApiError
     */
    public static documentsControllerCreate(
        requestBody: DocumentCreateDto,
    ): CancelablePromise<DocumentDto_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/documents',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns DocumentDto_Output
     * @throws ApiError
     */
    public static documentsControllerGetOne(
        id: string,
    ): CancelablePromise<DocumentDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/documents/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns DocumentDto_Output
     * @throws ApiError
     */
    public static documentsControllerUpdate(
        id: string,
        requestBody: DocumentUpdateDto,
    ): CancelablePromise<DocumentDto_Output> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/documents/{id}',
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
    public static documentsControllerRemove(
        id: string,
    ): CancelablePromise<OkResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/documents/{id}',
            path: {
                'id': id,
            },
        });
    }
}
