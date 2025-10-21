/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DocumentUpdateDto = {
    title?: string;
    content?: any;
    scraperId?: string;
    scrapedAt?: any;
    type: DocumentUpdateDto.type;
};
export namespace DocumentUpdateDto {
    export enum type {
        MD = 'MD',
        XML = 'XML',
        JSON = 'JSON',
    }
}

