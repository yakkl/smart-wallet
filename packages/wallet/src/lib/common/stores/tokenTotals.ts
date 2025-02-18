// lib/stores/tokenTotals.ts
import { derived, type Readable } from 'svelte/store';
import { yakklCombinedTokenStore } from '$lib/common/stores';
import { log } from "$lib/plugins/Logger"; // Ensure logger is available
import { DEBUG_ALL_LOGS } from '../constants';

// Type definition for the store value
export type TokenTotals = {
  portfolioTotal: number;
  formattedTotal: string;
  chainTotals: {
    byChain: Record<number, number>;
    formatted: Record<string, string>;
  };
};

// Debugging flag (set to true when troubleshooting)
const DEBUG_LOGS = DEBUG_ALL_LOGS;

export const tokenTotals: Readable<TokenTotals> = derived(
  yakklCombinedTokenStore,
  (tokens, set) => {
    if (DEBUG_LOGS) log.debug("Derived tokenTotals triggered with tokens:", tokens);

    // Calculate total portfolio value
    const portfolioTotal = tokens.reduce((sum, token) => {
      if (!token) return sum;

      // Corrected balance scaling with decimals
      const adjustedBalance = token.balance
        ? Number(token.balance) / (10 ** (token.decimals ?? 18))
        : 0;

      log.debug('Token:', token, 'Adjusted Balance:', adjustedBalance);

      const value = adjustedBalance * (token.price?.price ?? 0);

      if (DEBUG_LOGS) {
        log.debug(
          `Token: ${token.symbol} | Balance: ${token.balance} (Adjusted: ${adjustedBalance}) | ` +
          `Price: ${token.price?.price ?? 0} | Value: ${value}`
        );
      }

      return sum + value;
    }, 0);

    log.debug("Portfolio Total:", portfolioTotal);

    // Format portfolio total
    const formattedTotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(portfolioTotal);

    // Calculate totals by blockchain network
    const chainTotals = tokens.reduce((acc, token) => {
      if (!token) return acc;

      const chainId = token.chainId ?? -1; // Default to -1 if undefined

      const adjustedBalance = token.balance
        ? Number(token.balance) / (10 ** (token.decimals ?? 18))
        : 0;

      log.debug('Token:', token, 'Adjusted Balance:', adjustedBalance, 'token.balance:', token.balance, 'token.decimals:', token.decimals);

      const value = adjustedBalance * (token.price?.price ?? 0);

      log.debug('Token value:', value, 'adjustedBalance:', adjustedBalance, 'Token price:', token.price?.price);

      acc[chainId] = (acc[chainId] ?? 0) + value;
      return acc;
    }, {} as Record<number, number>);

    // Format totals per blockchain
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

    if (DEBUG_LOGS) {
      log.debug("Portfolio Total:", portfolioTotal, formattedTotal);
      log.debug("Chain Totals:", chainTotals, formattedChainTotals);
    }

    // Set the derived store value
    set({
      portfolioTotal,
      formattedTotal,
      chainTotals: {
        byChain: chainTotals,
        formatted: formattedChainTotals
      }
    });
  },
  { // Initial Value
    portfolioTotal: 0,
    formattedTotal: "$0.00",
    chainTotals: { byChain: {}, formatted: {} }
  }
);
