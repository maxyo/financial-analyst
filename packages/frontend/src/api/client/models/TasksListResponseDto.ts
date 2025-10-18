/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskDto } from './TaskDto';
export type TasksListResponseDto = {
    /**
     * Returned tasks
     */
    items: Array<TaskDto>;
    /**
     * Total number of tasks matching the query
     */
    total: number;
    /**
     * Page size (limit) applied to the query
     */
    limit: number;
    /**
     * Offset applied to the query
     */
    offset: number;
};

