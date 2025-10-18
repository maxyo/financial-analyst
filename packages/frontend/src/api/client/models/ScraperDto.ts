/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AugmentedZodDto } from './AugmentedZodDto';
export type ScraperDto = {
    id: string;
    name: string;
    type: ScraperDto.type;
    config: AugmentedZodDto;
    /**
     * Post-processors list
     */
    postProcessors?: Array<string>;
};
export namespace ScraperDto {
    export enum type {
        API = 'API',
        HTML = 'HTML',
    }
}

