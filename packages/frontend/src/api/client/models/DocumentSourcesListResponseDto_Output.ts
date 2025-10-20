/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DocumentSourcesListResponseDto_Output = {
    /**
     * List of linked documents
     */
    items: Array<{
        /**
         * Profile-document link identifier
         */
        id: number;
        /**
         * Document UUID
         */
        documentId: string;
    }>;
    /**
     * Total links count
     */
    total: number;
    /**
     * Page size
     */
    limit: number;
    /**
     * Offset
     */
    offset: number;
};

