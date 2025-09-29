import { config as configDotenv } from 'dotenv';
import { TinkoffInvestApi } from 'tinkoff-invest-api';

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
