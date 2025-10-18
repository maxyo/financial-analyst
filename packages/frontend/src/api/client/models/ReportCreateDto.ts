/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReportCreateDto = {
    profile_id: number;
    type: ReportCreateDto.type;
    content: string;
    llmModel: string;
    tokens_in: number;
    tokens_out: number;
    cost: number;
};
export namespace ReportCreateDto {
    export enum type {
        MD = 'md',
        ARTICLE = 'article',
    }
}

