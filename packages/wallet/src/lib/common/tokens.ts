import type { TokenData } from './interfaces';
import { get } from 'svelte/store';
import { ethers } from 'ethers-v6';
import { yakklTokenDataStore, yakklTokenDataCustomStore, setYakklTokenDataCustomStorage, setYakklTokenDataStorage, updateCombinedTokenStore, yakklCombinedTokenStore } from '$lib/common/stores';
import { isEqual } from 'lodash-es';
import { log } from "$plugins/Logger";
import { computeTokenValue } from './computeTokenValue';

// Helper functions to get balance for a token

export async function getTokenBalance(
  token: TokenData,
  userAddress: string,
  provider: ethers.Provider
): Promise<string | undefined> {
  try {
    if (!ethers.isAddress(token.address)) {
      log.error(`Invalid token address: ${token.address}`);
      return undefined;
    }

    // Handle native tokens (like ETH)
    if (token.isNative) {
      const balance = await provider.getBalance(userAddress);
      return ethers.formatUnits(balance, 18); // Assumes 18 decimals for native tokens
    }

    // ERC-20 Token
    const tokenContract = new ethers.Contract(
      token.address,
      [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
      ],
      provider
    );

    // Validate the token supports balanceOf and decimals
    try {
      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch {
      log.error('The contract does not implement balanceOf or it reverted.');
      return undefined;
    }
  } catch (error) {
    log.error(`Failed to get balance for token: ${token.name}`, false, error);
    return undefined;
  }
}

// Example usage:
// updateTokenBalances(userAddress, provider)
//   .then(() => console.log('Balances updated'))
//   .catch((error) => console.log('Error updating balances:', error));

export async function updateTokenBalances(userAddress: string, provider: ethers.Provider): Promise<void> {
  try {
    const [defaultTokens, customTokens] = await Promise.all([
      updateTokenDataBalances(userAddress, provider),
      updateTokenDataCustomBalances(userAddress, provider),
    ]);
    updateCombinedTokenStore();
  } catch (error) {
    log.error('Error updating token balances:', false, error);
  }
}

// Updates prices and balances for all default tokens
export async function updateTokenDataBalances(userAddress: string, provider: ethers.Provider): Promise<TokenData[]> {
  try {
    const tokens = get(yakklTokenDataStore); // Fetch default tokens from storage or store
    if (!tokens || tokens.length === 0) {
      log.warn('No tokens available to update balances');
      return [];
    }

    // Fetch balances for all default tokens
    const updatedTokens = await Promise.all(
      tokens.map(async (token) => {
        try {
          const balance = await getTokenBalance(token, userAddress, provider);
          return {
            ...token,
            balance: balance !== undefined ? balance : token.balance,
            value: 0, // Reset value after updating balance
          };
        } catch (balanceError) {
          log.error(`Error fetching balance for token ${token.symbol}:`, false, balanceError);
          return token; // Return token unchanged on error
        }
      })
    );

    // Update the store only if the data has changed
    const currentTokens = get(yakklTokenDataStore);
    if (!isEqual(currentTokens, updatedTokens)) {
      await setYakklTokenDataStorage(updatedTokens);
    }

    return updatedTokens;
  } catch (error) {
    log.error('Error updating token balances:', false, error);
    return []; // Return an empty array on error
  }
}

// Updates prices and balances for all custom tokens
export async function updateTokenDataCustomBalances(userAddress: string, provider: ethers.Provider): Promise<TokenData[]> {
  try {
    const customTokens = get(yakklTokenDataCustomStore);
    if (!customTokens || customTokens.length === 0) {
      log.warn('No custom tokens available to update balances');
      return [];
    }

    // Fetch balances for all custom tokens
    const updatedCustomTokens = await Promise.all(
      customTokens.map(async (token) => {
        try {
          const balance = await getTokenBalance(token, userAddress, provider);
          return {
            ...token,
            balance: balance !== undefined ? balance : token.balance,
            value: 0, // Reset value after updating balance
          };
        } catch (balanceError) {
          log.error(`Error fetching balance for custom token ${token.symbol}:`, false, balanceError);
          return token; // Return token unchanged on error
        }
      })
    );

    // Update the store only if the data has changed
    const currentCustomTokens = get(yakklTokenDataCustomStore);
    if (!isEqual(currentCustomTokens, updatedCustomTokens)) {
      await setYakklTokenDataCustomStorage(updatedCustomTokens);
    }

    return updatedCustomTokens;
  } catch (error) {
    log.error('Error updating custom token balances:', false, error);
    return []; // Return an empty array on error
  }
}

// For memory store only
export function updateTokenValues() {
  yakklCombinedTokenStore.update(tokens =>
    tokens.map(token => {
      const { value } = computeTokenValue(token);
      return { ...token, value };
    })
  );
}
