/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaskDto = {
    /**
     * Task numeric identifier
     */
    id: number;
    /**
     * Task name
     */
    name: string;
    /**
     * Optional task description
     */
    description?: Record<string, any>;
    /**
     * Prompt/template used for the task
     */
    prompt: string;
    /**
     * Creation timestamp (ISO 8601)
     */
    created_at: string;
    /**
     * Last update timestamp (ISO 8601)
     */
    updated_at: string;
};

