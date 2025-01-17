import type { TokenData } from './interfaces';
import { get } from 'svelte/store';
import { ethers } from 'ethers-v6';
import { yakklTokenDataStore, yakklTokenDataCustomStore, setYakklTokenDataCustomStorage, setYakklTokenDataStorage, getYakklTokenData, updateCombinedTokenStore, yakklCombinedTokenStore } from '$lib/common/stores';
import { isEqual } from 'lodash-es';


  // Helper function to get balance for a token

export async function getTokenBalance(
  token: TokenData,
  userAddress: string,
  provider: ethers.Provider
): Promise<string | undefined> {
  try {
    if (!ethers.isAddress(token.address)) {
      // console.log(`Invalid token address: ${token.address}`);
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
      console.log('The contract does not implement balanceOf or it reverted.');
      return undefined;
    }
  } catch (error) {
    console.log(`Failed to get balance for token: ${token.name}`, error);
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
    console.log('Error updating token balances:', error);
  }
}

// Updates prices and balances for all default tokens
export async function updateTokenDataBalances(userAddress: string, provider: ethers.Provider): Promise<TokenData[]> {
  try {
    const tokens = get(yakklTokenDataStore); // Fetch default tokens from storage or store

    if (!tokens || tokens.length === 0) {
      console.log('No tokens available to update balances');
      return [];
    }

    // Fetch balances for all default tokens
    const updatedTokens = await Promise.all(
      tokens.map(async (token) => {
        try {
          const balance = await getTokenBalance(token, userAddress, provider);
          // const price = await getTokenPrice(token, provider);
          return {
            ...token,
            balance: balance !== undefined ? balance : token.balance,
          };
        } catch (balanceError) {
          console.log(`Error fetching balance for token ${token.symbol}:`, balanceError);
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
    console.log('Error updating token balances:', error);
    return []; // Return an empty array on error
  }
}

// Updates prices and balances for all custom tokens
export async function updateTokenDataCustomBalances(userAddress: string, provider: ethers.Provider): Promise<TokenData[]> {
  try {
    const customTokens = get(yakklTokenDataCustomStore);

    if (!customTokens || customTokens.length === 0) {
      console.log('No custom tokens available to update balances');
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
          };
        } catch (balanceError) {
          console.log(`Error fetching balance for custom token ${token.symbol}:`, balanceError);
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
    console.log('Error updating custom token balances:', error);
    return []; // Return an empty array on error
  }
}

export function updateTokenValues() {
  yakklCombinedTokenStore.update(tokens =>
    tokens.map(token => ({
      ...token,
      value: (Number(token.balance) ?? 0) * (token.price?.price ?? 0)
    }))
  );
}

// {
//     "chainId": 1,
//     "address": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
//     "name": "Shiba Inu",
//     "symbol": "SHIB",
//     "decimals": 18,
//     "isNative": false,
//     "isStablecoin": false,
//     "logoURI": "https://assets.coingecko.com/coins/images/11939/thumb/shiba.png?1622619446"
// },
// {
//     "chainId": 1,
//     "address": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
//     "name": "Pepe",
//     "symbol": "PEPE",
//     "decimals": 18,
//     "isNative": false,
//     "isStablecoin": false,
//     "logoURI": "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg?1682922725"
//   },
//   {
//     "chainId": 1,
//     "address": "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
//     "name": "PayPal USD",
//     "symbol": "PYUSD",
//     "decimals": 6,
//     "isNative": false,
//     "isStablecoin": true,
//     "logoURI": "https://assets.coingecko.com/coins/images/31212/large/PYUSD_Logo_%282%29.png?1691458314"
//   },
//   {
//     "chainId": 1,
//     "name": "Coinbase Wrapped BTC",
//     "address": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
//     "symbol": "cbBTC",
//     "decimals": 8,
//     "isNative": false,
//     "isStablecoin": false,
//     "logoURI": "https://assets.coingecko.com/coins/images/40143/standard/cbbtc.webp"
//   }
