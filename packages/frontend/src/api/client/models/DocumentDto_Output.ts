/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DocumentDto_Output = {
    id: string;
    title: string;
    content: string;
    scraper: {
        id?: string;
        name?: string;
    };
    scrapedAt: string;
    date: string;
    meta: Record<string, (string | number)>;
    type: DocumentDto_Output.type;
    contentHash: string;
};
export namespace DocumentDto_Output {
    export enum type {
        MD = 'MD',
        XML = 'XML',
        JSON = 'JSON',
    }
}

