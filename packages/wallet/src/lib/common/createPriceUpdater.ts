import { writable } from 'svelte/store';
import type { TokenData } from './interfaces';
import type { PriceManager } from '$lib/plugins/PriceManager';
import { log } from "$plugins/Logger";

// Utility for debouncing
function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function createPriceUpdater(priceManager: PriceManager) {
  const tokens = writable<TokenData[]>([]);
  const { subscribe, set } = tokens;

  log.debug('createPriceUpdater - Initializing price updater...');

  async function fetchPrices(tokensArray: TokenData[]): Promise<TokenData[]> {
    const BATCH_SIZE = 6; // Adjust batch size for performance
    const updatedTokens: TokenData[] = [];

    log.debug('fetchPrices - Received tokensArray:', tokensArray);

    if (!tokensArray || tokensArray.length === 0) {
      log.error('fetchPrices - No tokens to process. Exiting early.');
      return [];
    }

    for (let i = 0; i < tokensArray.length; i += BATCH_SIZE) {
      const batch = tokensArray.slice(i, i + BATCH_SIZE);
      log.debug(`fetchPrices - Processing batch ${i / BATCH_SIZE + 1}:`, batch);

      try {
        const batchResults = await Promise.all(
          batch.map(async (token) => {
            log.debug(`fetchPrices - Calling fetchTokenData for ${token.symbol}`);
            return fetchTokenData(token, priceManager);
          })
        );

        updatedTokens.push(...batchResults);
      } catch (error) {
        log.errorStack('fetchPrices - Error processing batch:', batch, error);
      }
    }

    log.debug('fetchPrices - Final updated tokens:', updatedTokens);

    return updatedTokens;
  }


  async function fetchTokenData(token: TokenData, priceManager: PriceManager): Promise<TokenData> {
    const pair = `${token.symbol}-USD`;
    try {
      const marketPrice = await priceManager.getMarketPrice(pair);
      const price = marketPrice?.price ?? 0;

      // Fix for handling decimals in calculations
      const adjustedBalance = token.balance ? Number(token.balance) / (10 ** token.decimals) : 0;
      const value = adjustedBalance * price;

      return {
        ...token,
        price: {
          price: price,
          provider: marketPrice?.provider ?? "",
          lastUpdated: new Date() // Ensure lastUpdated is present
        },
        value,
        formattedValue: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value)
      };
    } catch (error) {
      log.error(`fetchTokenData - Failed to fetch price for ${token.symbol}`, error);
      return {
        ...token,
        price: { price: 0, provider: "", lastUpdated: new Date() }, // Ensures lastUpdated is present, status removed
        value: 0
      };
    }
  }



  // Debounced fetch to reduce frequent updates
  const debouncedFetchPrices = debounce(fetchPrices, 5000);

  return { subscribe, fetchPrices };
}
