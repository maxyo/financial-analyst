/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignDocumentSourceDto } from '../models/AssignDocumentSourceDto';
import type { AssignTaskDto } from '../models/AssignTaskDto';
import type { DocumentSourceDto } from '../models/DocumentSourceDto';
import type { DocumentSourcesListResponseDto } from '../models/DocumentSourcesListResponseDto';
import type { ProfileCreateDto } from '../models/ProfileCreateDto';
import type { ProfileDto } from '../models/ProfileDto';
import type { ProfilesListResponseDto } from '../models/ProfilesListResponseDto';
import type { ProfileTaskDto } from '../models/ProfileTaskDto';
import type { ProfileUpdateDto } from '../models/ProfileUpdateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfilesService {
    /**
     * @param limit Limit
     * @param offset Offset
     * @returns ProfilesListResponseDto List profiles with pagination
     * @throws ApiError
     */
    public static profileControllerList(
        limit?: number,
        offset?: number,
    ): CancelablePromise<ProfilesListResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles',
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ProfileDto Created profile
     * @throws ApiError
     */
    public static profileControllerCreate(
        requestBody: ProfileCreateDto,
    ): CancelablePromise<ProfileDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profiles',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ProfileDto Profile by id
     * @throws ApiError
     */
    public static profileControllerGetOne(
        id: string,
    ): CancelablePromise<ProfileDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ProfileDto Updated profile
     * @throws ApiError
     */
    public static profileControllerUpdate(
        id: string,
        requestBody: ProfileUpdateDto,
    ): CancelablePromise<ProfileDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/profiles/{id}',
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
    public static profileControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profiles/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param limit Limit
     * @param offset Offset
     * @returns DocumentSourcesListResponseDto List document sources assigned to profile
     * @throws ApiError
     */
    public static profileControllerListSources(
        id: string,
        limit?: number,
        offset?: number,
    ): CancelablePromise<DocumentSourcesListResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/{id}/document-sources',
            path: {
                'id': id,
            },
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns DocumentSourceDto Assigned document source
     * @throws ApiError
     */
    public static profileControllerAssignSource(
        id: string,
        requestBody: AssignDocumentSourceDto,
    ): CancelablePromise<DocumentSourceDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profiles/{id}/document-sources',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param documentId
     * @returns any Unassign result
     * @throws ApiError
     */
    public static profileControllerUnassignSource(
        id: string,
        documentId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profiles/{id}/document-sources/{documentId}',
            path: {
                'id': id,
                'documentId': documentId,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ProfileTaskDto Assigned task result
     * @throws ApiError
     */
    public static profileControllerAssignTask(
        id: string,
        requestBody: AssignTaskDto,
    ): CancelablePromise<ProfileTaskDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profiles/{id}/task',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns ProfileTaskDto Get assigned task for profile
     * @throws ApiError
     */
    public static profileControllerGetTask(
        id: string,
    ): CancelablePromise<ProfileTaskDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/{id}/task',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any Unassign task from profile
     * @throws ApiError
     */
    public static profileControllerUnassignTask(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profiles/{id}/task',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any Enqueue aggregate analysis job for profile
     * @throws ApiError
     */
    public static profileControllerRunAggregate(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profiles/{id}/run',
            path: {
                'id': id,
            },
        });
    }
}
