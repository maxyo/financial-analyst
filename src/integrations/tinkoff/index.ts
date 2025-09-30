import { config as configDotenv } from 'dotenv';
import { TinkoffInvestApi, Helpers } from 'tinkoff-invest-api';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata';
import { OperationType } from 'tinkoff-invest-api/dist/generated/operations';
import { Quotation } from 'tinkoff-invest-api/dist/generated/common';
import { InstrumentIdType } from 'tinkoff-invest-api/dist/generated/instruments';

configDotenv();

let apiInstance: TinkoffInvestApi | null = null;

export function getApi(): TinkoffInvestApi {
  if (apiInstance) return apiInstance;
  const token = process.env.TINKOFF_TOKEN;
  if (!token) {
    throw new Error('TINKOFF_TOKEN not set in environment');
  }
  apiInstance = new TinkoffInvestApi({ token });
  return apiInstance;
}

// Re-export SDK utilities/types through the integration layer to encapsulate direct SDK access
export { Helpers, CandleInterval, OperationType, InstrumentIdType };
export type { Quotation };
