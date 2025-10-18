/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DocumentSourceDto } from './DocumentSourceDto';
export type DocumentSourcesListResponseDto = {
    /**
     * Assigned document sources
     */
    items: Array<DocumentSourceDto>;
    /**
     * Total number of assigned sources
     */
    total: number;
    /**
     * Page size (limit) applied to the query
     */
    limit: number;
    /**
     * Offset applied to the query
     */
    offset: number;
};

