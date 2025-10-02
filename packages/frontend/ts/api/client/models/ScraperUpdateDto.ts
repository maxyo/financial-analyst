/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScraperUpdateDto = {
    /**
     * Scraper name
     */
    name?: string;
    /**
     * Scraper type
     */
    type?: ScraperUpdateDto.type;
    /**
     * Scraper config
     */
    config?: Record<string, any>;
};
export namespace ScraperUpdateDto {
    /**
     * Scraper type
     */
    export enum type {
        API = 'API',
        HTML = 'HTML',
    }
}

