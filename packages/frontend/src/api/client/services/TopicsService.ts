/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OkResponseDto_Output } from '../models/OkResponseDto_Output';
import type { TopicCreateDtoClass } from '../models/TopicCreateDtoClass';
import type { TopicDtoClass_Output } from '../models/TopicDtoClass_Output';
import type { TopicsListResponseDtoClass_Output } from '../models/TopicsListResponseDtoClass_Output';
import type { TopicUpdateDtoClass } from '../models/TopicUpdateDtoClass';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TopicsService {
    /**
     * List topics
     * Returns a paginated list of topics ordered by id DESC. Includes parent relationship when present.
     * @param limit
     * @param offset
     * @returns TopicsListResponseDtoClass_Output
     * @throws ApiError
     */
    public static topicsControllerList(
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<TopicsListResponseDtoClass_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/topics',
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    }
    /**
     * Create topic
     * Create a new topic with optional description and parent reference.
     * @param requestBody
     * @returns TopicDtoClass_Output
     * @throws ApiError
     */
    public static topicsControllerCreate(
        requestBody: TopicCreateDtoClass,
    ): CancelablePromise<TopicDtoClass_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/topics',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get topic by ID
     * Fetch a single topic by its numeric ID. Includes parent info when available.
     * @param id
     * @returns TopicDtoClass_Output
     * @throws ApiError
     */
    public static topicsControllerGetOne(
        id: string,
    ): CancelablePromise<TopicDtoClass_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/topics/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update topic
     * Partially update a topic by numeric ID. Supports changing name, description, and parent.
     * @param id
     * @param requestBody
     * @returns TopicDtoClass_Output
     * @throws ApiError
     */
    public static topicsControllerUpdate(
        id: string,
        requestBody: TopicUpdateDtoClass,
    ): CancelablePromise<TopicDtoClass_Output> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/topics/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete topic
     * Delete a topic by numeric ID.
     * @param id
     * @returns OkResponseDto_Output
     * @throws ApiError
     */
    public static topicsControllerRemove(
        id: string,
    ): CancelablePromise<OkResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/topics/{id}',
            path: {
                'id': id,
            },
        });
    }
}
