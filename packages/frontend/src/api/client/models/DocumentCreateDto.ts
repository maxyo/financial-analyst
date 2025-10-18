/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DocumentCreateDto = {
    title: string;
    /**
     * UUID of scraper
     */
    scraperId: string;
    /**
     * Content of the document. If non-string is provided will be stringified.
     */
    content: Record<string, any>;
    /**
     * Scraped at date
     */
    scrapedAt?: string;
    /**
     * Content hash. If omitted, server computes sha256(content).
     */
    contentHash?: string;
};

