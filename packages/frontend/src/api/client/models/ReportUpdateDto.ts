/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReportUpdateDto = {
    type: ReportUpdateDto.type;
    content: string;
    llmModel: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
};
export namespace ReportUpdateDto {
    export enum type {
        MD = 'md',
        ARTICLE = 'article',
    }
}

