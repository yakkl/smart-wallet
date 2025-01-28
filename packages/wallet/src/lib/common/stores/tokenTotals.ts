// lib/stores/tokenTotals.ts
import { derived, type Readable } from 'svelte/store';
import { yakklCombinedTokenStore } from '$lib/common/stores';

// Type definition for the store value
export type TokenTotals = {
  portfolioTotal: number;
  formattedTotal: string;
  chainTotals: {
    byChain: Record<number, number>;
    formatted: Record<string, string>;
  };
};

// Create and export the store with proper typing
export const tokenTotals: Readable<TokenTotals> = derived(
  yakklCombinedTokenStore,
  (tokens) => {
      const portfolioTotal = tokens.reduce((sum, token) => {
      const tokenValue = token?.value ?? 0; // Get the token value or default to 0
      const newSum = sum + tokenValue; // Calculate the new sum
      // console.log('Sum:', newSum, 'Token:', token); // Log the sum and the token
      return newSum; // Return the updated sum for the next iteration
    }, 0);


    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(portfolioTotal);

    const chainTotals = tokens.reduce((acc, token) => {
      acc[token.chainId] = (acc[token.chainId] ?? 0) + (token.value ?? 0);
      return acc;
    }, {} as Record<number, number>);

    const formattedChainTotals = Object.entries(chainTotals).reduce(
      (acc, [chainId, total]) => {
        acc[chainId] = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(total);
        return acc;
      },
      {} as Record<string, string>
    );

    return {
      portfolioTotal,
      formattedTotal,
      chainTotals: {
        byChain: chainTotals,
        formatted: formattedChainTotals
      }
    };
  }
);
