/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class JobsService {
    /**
     * @returns any List of queues with job counts by status
     * @throws ApiError
     */
    public static jobsControllerListQueues(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jobs/queues',
        });
    }
    /**
     * @param queue
     * @returns any List jobs for a specific queue with pagination and status filter
     * @throws ApiError
     */
    public static jobsControllerListJobs(
        queue: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jobs/{queue}',
            path: {
                'queue': queue,
            },
        });
    }
    /**
     * @param queue
     * @param id
     * @returns any Get a specific job details by id
     * @throws ApiError
     */
    public static jobsControllerGetJob(
        queue: string,
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/jobs/{queue}/{id}',
            path: {
                'queue': queue,
                'id': id,
            },
        });
    }
}
