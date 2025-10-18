/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TasksListResponseDtoClass_Output = {
    items: Array<{
        id: number;
        name: string;
        description: (string | null);
        prompt: string;
        created_at: string;
        updated_at: string;
    }>;
    total: number;
    limit: number;
    offset: number;
};

