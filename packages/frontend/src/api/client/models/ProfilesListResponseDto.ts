/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProfileDto } from './ProfileDto';
export type ProfilesListResponseDto = {
    /**
     * Returned profiles
     */
    items: Array<ProfileDto>;
    /**
     * Total number of profiles matching the query
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

