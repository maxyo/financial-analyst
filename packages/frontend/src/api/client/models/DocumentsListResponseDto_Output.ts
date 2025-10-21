/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DocumentsListResponseDto_Output = {
    items: Array<{
        id: string;
        title: string;
        content: string;
        scraper: ({
            name: string;
            type: string;
            config: {
                url: string;
            };
            postProcessors?: Array<{
                /**
                 * Тип пост-обработчика: обрезка пробелов
                 */
                type: string;
                /**
                 * Настройки пост-обработчика TRIM_WHITESPACE
                 */
                config: {
                    collapseMultipleSpaces: boolean;
                    collapseNewlines: boolean;
                    trimEachLine: boolean;
                };
            }>;
            id: string;
            topicId?: (number | null);
        } | {
            name: string;
            type: string;
            config: {
                url: string;
                selectors: Array<{
                    name: string;
                    selector: string;
                    attr?: string;
                    asHtml?: boolean;
                }>;
                headers: Record<string, string>;
                timeoutMs: number;
                delayMs?: number;
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
                /**
                 * Тип пост-обработчика: обрезка пробелов
                 */
                type: string;
                /**
                 * Настройки пост-обработчика TRIM_WHITESPACE
                 */
                config: {
                    collapseMultipleSpaces: boolean;
                    collapseNewlines: boolean;
                    trimEachLine: boolean;
                };
            }>;
            id: string;
            topicId?: (number | null);
        });
        scrapedAt: any;
        date: any;
        meta: Record<string, (string | number)>;
        type: 'MD' | 'XML' | 'JSON';
        contentHash: string;
    }>;
    total: number;
    limit: number;
    offset: number;
};

