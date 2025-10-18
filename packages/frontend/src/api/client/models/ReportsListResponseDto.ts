/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReportDto } from './ReportDto';
export type ReportsListResponseDto = {
    /**
     * Returned reports
     */
    items: Array<ReportDto>;
    /**
     * Total number of reports matching the query
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

