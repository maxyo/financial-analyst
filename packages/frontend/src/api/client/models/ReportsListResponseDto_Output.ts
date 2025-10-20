/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReportsListResponseDto_Output = {
    items: Array<{
        id: string;
        profile_id: (number | null);
        type: (string | null);
        content: (string | null);
        llmModel: (string | null);
        created_at: string;
        tokens_in: (number | null);
        tokens_out: (number | null);
        cost: (number | null);
    }>;
    total: number;
    limit: number;
    offset: number;
};

