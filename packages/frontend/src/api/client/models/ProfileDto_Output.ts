/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProfileDto_Output = {
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
    createdAt: string;
    /**
     * Update time (ISO 8601)
     */
    updatedAt: string;
    /**
     * Related topic (if used)
     */
    topicId?: (number | null);
};

