import { TinkoffProvider } from './providers/tinkoff';

import type { MarketProvider } from './provider';


let providerInstance: MarketProvider | null = null;

export function getProvider(): MarketProvider {
  if (providerInstance) return providerInstance;
  const providerName = (process.env.API_PROVIDER || 'tinkoff').toLowerCase();
  switch (providerName) {
    case 'tinkoff':
    default:
      providerInstance = new TinkoffProvider();
      return providerInstance;
  }
}

export function setProvider(p: MarketProvider) {
  providerInstance = p;
}
