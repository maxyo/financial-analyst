/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * @returns any
     * @throws ApiError
     */
    public static healthControllerGetHealth(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/health',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static summaryControllerGetSummary(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/summary',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static underlyingControllerGetUnderlying(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/underlying-summary',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static candlesControllerGetCandles(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/candles',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static positionsControllerGetPositions(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/positions',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static tradesControllerGetTrades(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/trades',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static searchControllerSearch(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/search',
        });
    }
}
