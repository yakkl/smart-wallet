import { writable, get } from 'svelte/store';
import type { TokenData } from './interfaces';
import type { PriceManager } from '$lib/plugins/PriceManager';
import { EthereumBigNumber } from './bignumber-ethereum';

// Utility for debouncing
function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function createPriceUpdater(priceManager: PriceManager, fetchInterval = 30000) {
  const tokens = writable<TokenData[]>([]);
  const { subscribe, set } = tokens;

  async function fetchPrices(tokensArray: TokenData[]) {
    const BATCH_SIZE = 5; // Maximum tokens per batch request
    const updatedTokens: TokenData[] = [];

    for (let i = 0; i < tokensArray.length; i += BATCH_SIZE) {
      const batch = tokensArray.slice(i, i + BATCH_SIZE);
      try {
        const batchResults = await Promise.all(
          batch.map((token) => fetchTokenData(token, priceManager))
        );
        updatedTokens.push(...batchResults);
      } catch (error) {
        console.log('Error fetching batch:', batch, error);
      }
    }

    const currentTokens = get(tokens);
    if (JSON.stringify(updatedTokens) !== JSON.stringify(currentTokens)) {
      set(updatedTokens); // Update only if tokens have changed
    }
  }

  async function fetchTokenData(token: TokenData, priceManager: PriceManager): Promise<TokenData> {
    const pair = `${token.symbol}-USD`;

    try {
      const marketPrice = await priceManager.getMarketPrice(pair);
      const price = marketPrice?.price ?? 0;
      const value = token.balance
        ? Number(EthereumBigNumber.from(token.balance).toBigInt() * EthereumBigNumber.from(price).toBigInt())
        : 0;

      return { ...token, price: marketPrice || null, value };
    } catch (error) {
      console.log(`Failed to fetch price for token ${token.symbol}`, error);
      return token; // Return token as is on failure
    }
  }

  // Debounced fetch to reduce frequent updates
  const debouncedFetchPrices = debounce(fetchPrices, 5000);

  const interval = setInterval(() => {
    const currentTokens = get(tokens);
    debouncedFetchPrices(currentTokens);
  }, fetchInterval);

  return {
    subscribe,
    fetchPrices,
    destroy: () => clearInterval(interval),
  };
}
