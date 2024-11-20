
import type { TokenData } from '$lib/common';

export const ethTokenData: TokenData = {
  chainId: 1,
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  name: 'Wrapped Ether',
  symbol: 'WETH',
  decimals: 18,
  logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  isNative: true,
  priceData: [
    { provider: 'coingecko', price: 2760, lastUpdated: new Date() },
    { provider: 'coinmarketcap', price: 2775, lastUpdated: new Date() },
  ],
  volume: 1000000,
  currentPrice: 2750,
  timeline: '24h',
};

export const btcTokenData: TokenData = {
  chainId: 1,
  address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
  name: 'Wrapped Bitcoin',
  symbol: 'WBTC',
  decimals: 8,
  logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
  isNative: true,
  priceData: [
    { provider: 'coingecko', price: 60000, lastUpdated: new Date() },
    { provider: 'coinmarketcap', price: 60100, lastUpdated: new Date() },
  ],
  volume: 500000,
  currentPrice: 60500,
  timeline: '24h',
};
