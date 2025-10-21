/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReportCreateDto = {
    profileId: number;
    type: ReportCreateDto.type;
    content: string;
    llmModel: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
};
export namespace ReportCreateDto {
    export enum type {
        MD = 'md',
        ARTICLE = 'article',
    }
}

