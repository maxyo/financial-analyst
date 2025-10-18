/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AugmentedZodDto_Output } from '../models/AugmentedZodDto_Output';
import type { CollectionDto_Output } from '../models/CollectionDto_Output';
import type { CollectionsListResponseDto_Output } from '../models/CollectionsListResponseDto_Output';
import type { Function } from '../models/Function';
import type { OkResponseDto_Output } from '../models/OkResponseDto_Output';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CollectionsService {
    /**
     * @returns CollectionsListResponseDto_Output
     * @throws ApiError
     */
    public static collectionControllerList(): CancelablePromise<CollectionsListResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/collections',
        });
    }
    /**
     * @param requestBody
     * @returns CollectionDto_Output
     * @throws ApiError
     */
    public static collectionControllerCreate(
        requestBody: Function,
    ): CancelablePromise<CollectionDto_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/collections',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns CollectionDto_Output
     * @throws ApiError
     */
    public static collectionControllerGetOne(
        id: string,
    ): CancelablePromise<CollectionDto_Output> {
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
     * @returns CollectionDto_Output
     * @throws ApiError
     */
    public static collectionControllerUpdate(
        id: string,
        requestBody: Function,
    ): CancelablePromise<CollectionDto_Output> {
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
     * @returns OkResponseDto_Output
     * @throws ApiError
     */
    public static collectionControllerRemove(
        id: string,
    ): CancelablePromise<OkResponseDto_Output> {
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
     * @returns AugmentedZodDto_Output
     * @throws ApiError
     */
    public static collectionControllerDocuments(
        id: string,
    ): CancelablePromise<AugmentedZodDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/collections/{id}/documents',
            path: {
                'id': id,
            },
        });
    }
}
