/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DocumentsListResponseDto_Output = {
    items: Array<{
        id: string;
        title: string;
        content: string;
        scraper: {
            id: string;
            name: string;
        };
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

