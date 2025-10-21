/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReportsListResponseDto_Output = {
    items: Array<{
        id: string;
        profileId: (number | null);
        type: (string | null);
        content: (string | null);
        llmModel: (string | null);
        createdAt: any;
        tokensIn: (number | null);
        tokensOut: (number | null);
        cost: (number | null);
    }>;
    total: number;
    limit: number;
    offset: number;
};

