/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskCreateDto } from '../models/TaskCreateDto';
import type { TaskDto } from '../models/TaskDto';
import type { TasksListResponseDto } from '../models/TasksListResponseDto';
import type { TaskUpdateDto } from '../models/TaskUpdateDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TasksService {
    /**
     * @param limit Limit
     * @param offset Offset
     * @returns TasksListResponseDto List tasks with pagination
     * @throws ApiError
     */
    public static tasksControllerList(
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<TasksListResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tasks',
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    }
    /**
     * @param requestBody
     * @returns TaskDto Created task
     * @throws ApiError
     */
    public static tasksControllerCreate(
        requestBody: TaskCreateDto,
    ): CancelablePromise<TaskDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/tasks',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns TaskDto Task by id
     * @throws ApiError
     */
    public static tasksControllerGetOne(
        id: string,
    ): CancelablePromise<TaskDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tasks/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns TaskDto Updated task
     * @throws ApiError
     */
    public static tasksControllerUpdate(
        id: string,
        requestBody: TaskUpdateDto,
    ): CancelablePromise<TaskDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/tasks/{id}',
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
    public static tasksControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/tasks/{id}',
            path: {
                'id': id,
            },
        });
    }
}
