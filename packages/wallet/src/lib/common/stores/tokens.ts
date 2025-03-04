import { writable, derived } from 'svelte/store';
import type { SwapToken } from '$lib/common/interfaces';
import { ADDRESSES } from '$lib/plugins/contracts/evm/constants-evm';
import { log } from '$lib/plugins/Logger';

// Writable store to hold all tokens
export const tokens = writable<SwapToken[]>([]);

// Writable store to hold preferred token symbols
export const preferredTokenSymbols = writable<string[]>(['ETH', 'WETH', 'USDC', 'USDT', 'WBTC']);

// Derived store for tokens with preferred tokens listed first
export const sortedTokens = derived(
  [tokens, preferredTokenSymbols],
  ([$tokens, $preferredTokenSymbols]) => {
    // Filter out the preferred tokens from the main list
    const preferredTokens = $tokens.filter((token) =>
      $preferredTokenSymbols.includes(token.symbol)
    );

    const nonPreferredTokens = $tokens.filter(
      (token) => !$preferredTokenSymbols.includes(token.symbol)  && token.chainId === 1
    );

    let eth: SwapToken = {
      chainId: 1,
      address: ADDRESSES.WETH,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      isNative: true,
      isStablecoin: false,
      logoURI: '/images/ethereum.svg',
    };

    preferredTokens.unshift(eth);

    // Combine preferred tokens at the top, followed by the rest
    return [...preferredTokens, ...nonPreferredTokens];
  }
);

// Function to load tokens from static JSON file
export async function loadTokens() {
  try {
    const response = await fetch('/data/uniswap.json');
    const data = await response.json();

    // CoinGecko has a format similar to data.tokens while Uniswap has a format similar to data (just an array of tokens)
    // Determine the correct tokens array
    const tokensData = data.tokens || data?.data?.tokens || data;

    const loadedTokens: SwapToken[] = tokensData.map((token: SwapToken) => ({
      ...token,
      isStablecoin: ['USDC', 'USDT', 'DAI', 'BUSD'].includes(token.symbol), // Mark stablecoins
    }));

    // Update the tokens store
    tokens.set(loadedTokens);
  } catch (error) {
    log.error('Error loading tokens:', false, error);
  }
}
