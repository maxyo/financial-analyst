/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentCreateDto } from '../models/DocumentCreateDto';
import type { DocumentDto } from '../models/DocumentDto';
import type { DocumentsListResponseDto } from '../models/DocumentsListResponseDto';
import type { DocumentUpdateDto } from '../models/DocumentUpdateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DocumentsService {
    /**
     * @param limit Limit
     * @param offset Offset
     * @returns DocumentsListResponseDto List documents with pagination
     * @throws ApiError
     */
    public static documentsControllerList(
        limit?: number,
        offset?: number,
    ): CancelablePromise<DocumentsListResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/documents',
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    }
    /**
     * @param requestBody
     * @returns DocumentDto Created document
     * @throws ApiError
     */
    public static documentsControllerCreate(
        requestBody: DocumentCreateDto,
    ): CancelablePromise<DocumentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/documents',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns DocumentDto Document by id
     * @throws ApiError
     */
    public static documentsControllerGetOne(
        id: string,
    ): CancelablePromise<DocumentDto> {
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
     * @returns DocumentDto Updated document
     * @throws ApiError
     */
    public static documentsControllerUpdate(
        id: string,
        requestBody: DocumentUpdateDto,
    ): CancelablePromise<DocumentDto> {
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
     * @returns any Delete result
     * @throws ApiError
     */
    public static documentsControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/documents/{id}',
            path: {
                'id': id,
            },
        });
    }
}
