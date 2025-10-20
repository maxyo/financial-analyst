/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScrapersListResponseDto_Output = {
    items: Array<{
        data: ({
            name: string;
            type: string;
            config: {
                url: string;
            };
            postProcessors?: Array<{
                type: string;
                config: {
                    collapseMultipleSpaces: boolean;
                    collapseNewlines: boolean;
                    trimEachLine: boolean;
                };
            }>;
        } | {
            name: string;
            type: string;
            config: {
                url: string;
                selectors: Array<{
                    name: string;
                    selector: string;
                }>;
                headers: Record<string, string>;
                timeoutMs: number;
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
                    dateSelector?: string;
                    dateAttr?: string;
                    baseUrl?: string;
                    maxDocsPerPage?: number;
                };
            };
            postProcessors?: Array<{
                type: string;
                config: {
                    collapseMultipleSpaces: boolean;
                    collapseNewlines: boolean;
                    trimEachLine: boolean;
                };
            }>;
        });
    }>;
    total: number;
    limit: number;
    offset: number;
};

