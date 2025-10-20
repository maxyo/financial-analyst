/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OkResponseDto_Output } from '../models/OkResponseDto_Output';
import type { TaskCreateDtoClass } from '../models/TaskCreateDtoClass';
import type { TaskDtoClass_Output } from '../models/TaskDtoClass_Output';
import type { TasksListResponseDtoClass_Output } from '../models/TasksListResponseDtoClass_Output';
import type { TaskUpdateDtoClass } from '../models/TaskUpdateDtoClass';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TasksService {
    /**
     * List tasks
     * Returns a paginated list of tasks ordered by id DESC.
     * @param limit
     * @param offset
     * @returns TasksListResponseDtoClass_Output
     * @throws ApiError
     */
    public static tasksControllerList(
        limit: number = 50,
        offset?: number,
    ): CancelablePromise<TasksListResponseDtoClass_Output> {
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
     * Create task
     * Create a new analysis task with name, optional description, and prompt.
     * @param requestBody
     * @returns TaskDtoClass_Output
     * @throws ApiError
     */
    public static tasksControllerCreate(
        requestBody: TaskCreateDtoClass,
    ): CancelablePromise<TaskDtoClass_Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/tasks',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get task by ID
     * Fetch a single task by its numeric ID.
     * @param id
     * @returns TaskDtoClass_Output
     * @throws ApiError
     */
    public static tasksControllerGetOne(
        id: string,
    ): CancelablePromise<TaskDtoClass_Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tasks/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update task
     * Partially update task fields by numeric ID.
     * @param id
     * @param requestBody
     * @returns TaskDtoClass_Output
     * @throws ApiError
     */
    public static tasksControllerUpdate(
        id: string,
        requestBody: TaskUpdateDtoClass,
    ): CancelablePromise<TaskDtoClass_Output> {
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
     * Delete task
     * Delete a task by numeric ID.
     * @param id
     * @returns OkResponseDto_Output
     * @throws ApiError
     */
    public static tasksControllerRemove(
        id: string,
    ): CancelablePromise<OkResponseDto_Output> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/tasks/{id}',
            path: {
                'id': id,
            },
        });
    }
}
