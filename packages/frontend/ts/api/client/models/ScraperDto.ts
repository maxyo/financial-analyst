/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScraperDto = {
    id: string;
    name: string;
    type: ScraperDto.type;
    config: Record<string, any>;
};
export namespace ScraperDto {
    export enum type {
        API = 'API',
        HTML = 'HTML',
    }
}

