/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CollectionCreateDto } from '../models/CollectionCreateDto';
import type { CollectionDto } from '../models/CollectionDto';
import type { CollectionsListResponseDto } from '../models/CollectionsListResponseDto';
import type { CollectionUpdateDto } from '../models/CollectionUpdateDto';
import type { DocumentDto } from '../models/DocumentDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CollectionsService {
    /**
     * @param limit Limit
     * @param offset Offset
     * @param q Search by name substring
     * @returns CollectionsListResponseDto
     * @throws ApiError
     */
    public static collectionControllerList(
        limit?: number,
        offset?: number,
        q?: string,
    ): CancelablePromise<CollectionsListResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/collections',
            query: {
                'limit': limit,
                'offset': offset,
                'q': q,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CollectionDto
     * @throws ApiError
     */
    public static collectionControllerCreate(
        requestBody: CollectionCreateDto,
    ): CancelablePromise<CollectionDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/collections',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns CollectionDto
     * @throws ApiError
     */
    public static collectionControllerGetOne(
        id: string,
    ): CancelablePromise<CollectionDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/collections/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns CollectionDto
     * @throws ApiError
     */
    public static collectionControllerUpdate(
        id: string,
        requestBody: CollectionUpdateDto,
    ): CancelablePromise<CollectionDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/collections/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static collectionControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/collections/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param limit Limit
     * @param offset Offset
     * @returns DocumentDto
     * @throws ApiError
     */
    public static collectionControllerDocuments(
        id: string,
        limit?: number,
        offset?: number,
    ): CancelablePromise<Array<DocumentDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/collections/{id}/documents',
            path: {
                'id': id,
            },
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    }
}
