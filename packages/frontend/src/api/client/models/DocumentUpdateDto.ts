/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DocumentUpdateDto = {
    title?: string;
    /**
     * Content of the document. If non-string is provided will be stringified.
     */
    content?: Record<string, any>;
    /**
     * UUID of scraper
     */
    scraperId?: string;
    /**
     * Scraped at date
     */
    scrapedAt?: string;
};

