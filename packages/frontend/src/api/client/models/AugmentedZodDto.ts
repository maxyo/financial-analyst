/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AugmentedZodDto = {
    API: {
        url?: string;
    };
    HTML: {
        url?: string;
        selectors?: Array<{
            name: string;
            selector: string;
        }>;
        headers?: Record<string, string>;
        timeoutMs?: number;
        pagination?: {
            nextSelector?: string;
            nextUrlTemplate?: string;
            pageParam?: string;
            startPage?: number;
            maxPages?: number;
        };
        document?: {
            linkSelector: string;
            linkAttr?: string;
            titleSelector?: string;
            contentSelector?: string;
            baseUrl?: string;
            maxDocsPerPage?: number;
        };
    };
};

