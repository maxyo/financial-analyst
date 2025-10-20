/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignDocumentSourceDto } from '../models/AssignDocumentSourceDto';
import type { AssignTaskDto } from '../models/AssignTaskDto';
import type { DocumentSourceDto_Output } from '../models/DocumentSourceDto_Output';
import type { DocumentSourcesListResponseDto_Output } from '../models/DocumentSourcesListResponseDto_Output';
import type { OkResponseDto_Output } from '../models/OkResponseDto_Output';
import type { ProfileCreateDto } from '../models/ProfileCreateDto';
import type { ProfileDto_Output } from '../models/ProfileDto_Output';
import type { ProfileRunResponseDto_Output } from '../models/ProfileRunResponseDto_Output';
import type { ProfilesListResponseDto_Output } from '../models/ProfilesListResponseDto_Output';
import type { ProfileTaskDto_Output } from '../models/ProfileTaskDto_Output';
import type { ProfileUpdateDto } from '../models/ProfileUpdateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProfilesService {
    /**
     * List profiles
     * Returns a paginated list of analysis profiles. Sorted by id DESC. Query params: limit, offset.
     * @param limit Page size (default 50, up to 200)
     * @param offset Offset/start index (default 0)
     * @returns ProfilesListResponseDto_Output
     * @throws ApiError
     */
    public static profileControllerList(
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<ProfilesListResponseDto_Output> {
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
     * Create profile
     * Creates a new analysis profile.
     * @param requestBody
     * @returns ProfileDto_Output Created profile
     * @throws ApiError
     */
    public static profileControllerCreate(
        requestBody: ProfileCreateDto,
    ): CancelablePromise<ProfileDto_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profiles',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get profile
     * Returns a profile by numeric identifier.
     * @param id
     * @returns ProfileDto_Output Profile by id
     * @throws ApiError
     */
    public static profileControllerGetOne(
        id: string,
    ): CancelablePromise<ProfileDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update profile
     * Partially updates profile fields by ID.
     * @param id
     * @param requestBody
     * @returns ProfileDto_Output Updated profile
     * @throws ApiError
     */
    public static profileControllerUpdate(
        id: string,
        requestBody: ProfileUpdateDto,
    ): CancelablePromise<ProfileDto_Output> {
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
     * Delete profile
     * Deletes a profile by ID.
     * @param id
     * @returns OkResponseDto_Output Delete result
     * @throws ApiError
     */
    public static profileControllerRemove(
        id: string,
    ): CancelablePromise<OkResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profiles/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * List profile document sources
     * Returns a paginated list of documents linked to the profile.
     * @param id
     * @param limit Page size (default 50, up to 200)
     * @param offset Offset/start index (default 0)
     * @returns DocumentSourcesListResponseDto_Output List document sources assigned to profile
     * @throws ApiError
     */
    public static profileControllerListSources(
        id: string,
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<DocumentSourcesListResponseDto_Output> {
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
     * Assign document to profile
     * Creates a profile-document link if it does not exist.
     * @param id
     * @param requestBody
     * @returns DocumentSourceDto_Output Assigned document source
     * @throws ApiError
     */
    public static profileControllerAssignSource(
        id: string,
        requestBody: AssignDocumentSourceDto,
    ): CancelablePromise<DocumentSourceDto_Output> {
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
     * Unassign document from profile
     * Deletes the profile-document link.
     * @param id
     * @param documentId
     * @returns OkResponseDto_Output Unassign result
     * @throws ApiError
     */
    public static profileControllerUnassignSource(
        id: string,
        documentId: string,
    ): CancelablePromise<OkResponseDto_Output> {
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
     * Assign task to profile
     * Links an analysis task to the profile.
     * @param id
     * @param requestBody
     * @returns ProfileTaskDto_Output Assigned task result
     * @throws ApiError
     */
    public static profileControllerAssignTask(
        id: string,
        requestBody: AssignTaskDto,
    ): CancelablePromise<ProfileTaskDto_Output> {
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
     * Get profile task
     * Returns the identifier of the task assigned to the profile (or null).
     * @param id
     * @returns ProfileTaskDto_Output Get assigned task for profile
     * @throws ApiError
     */
    public static profileControllerGetTask(
        id: string,
    ): CancelablePromise<ProfileTaskDto_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/{id}/task',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Unassign task from profile
     * Unlinks the previously assigned analysis task from the profile.
     * @param id
     * @returns OkResponseDto_Output Unassign task from profile
     * @throws ApiError
     */
    public static profileControllerUnassignTask(
        id: string,
    ): CancelablePromise<OkResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profiles/{id}/task',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Run aggregate analysis
     * Enqueues an aggregate analysis job for the profile.
     * @param id
     * @returns ProfileRunResponseDto_Output Enqueue aggregate analysis job for profile
     * @throws ApiError
     */
    public static profileControllerRunAggregate(
        id: string,
    ): CancelablePromise<ProfileRunResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profiles/{id}/run',
            path: {
                'id': id,
            },
        });
    }
}
