/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScraperCreateDto = {
    /**
     * Scraper name
     */
    name: string;
    /**
     * Scraper type
     */
    type: ScraperCreateDto.type;
    /**
     * Scraper config
     */
    config: Record<string, any>;
};
export namespace ScraperCreateDto {
    /**
     * Scraper type
     */
    export enum type {
        API = 'API',
        HTML = 'HTML',
    }
}

