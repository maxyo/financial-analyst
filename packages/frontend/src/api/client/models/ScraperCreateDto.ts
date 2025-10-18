/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AugmentedZodDto } from './AugmentedZodDto';
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
    config: AugmentedZodDto;
    /**
     * Post-processors list
     */
    postProcessors?: Array<string>;
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

