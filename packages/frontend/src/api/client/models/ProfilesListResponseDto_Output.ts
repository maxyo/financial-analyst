/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProfilesListResponseDto_Output = {
    /**
     * Profiles list
     */
    items: Array<{
        /**
         * Profile ID
         */
        id: number;
        /**
         * Profile name
         */
        name: string;
        /**
         * Profile description (may be absent)
         */
        description: (string | null);
        /**
         * Creation time (ISO 8601)
         */
        created_at: string;
        /**
         * Update time (ISO 8601)
         */
        updated_at: string;
        /**
         * Related topic (if used)
         */
        topic_id?: (number | null);
    }>;
    /**
     * Total profiles count
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

