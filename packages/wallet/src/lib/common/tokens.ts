import type { TokenData } from './interfaces';
import { get } from 'svelte/store';
import { ethers } from 'ethers-v6';
import { yakklTokenDataStore, yakklTokenDataCustomStore, setYakklTokenDataCustomStorage, setYakklTokenDataStorage, getYakklTokenData, updateCombinedTokenStore } from '$lib/common/stores';
import { debug_log } from './debug-error';
import { isEqual } from 'lodash-es';


// type TokenKey = string;

// export interface TokenPair {
//   tokenIn: SwapToken;
//   tokenOut: SwapToken;
// }

// const commonTokens: Map<TokenKey, SwapToken> = new Map<TokenKey, SwapToken>( [
//   // Ethereum Mainnet (ChainId 1)
//   [ 'ETH-1', { chainId: 1, symbol: 'ETH', name: 'Ethereum', decimals: 18, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' } ], // ETH and WETH are the same
//   [ 'WETH-1', { chainId: 1, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' } ],
//   [ 'USDC-1', { chainId: 1, symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' } ],
//   [ 'USDT-1', { chainId: 1, symbol: 'USDT', name: 'Tether', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' } ],
//   [ 'DAI-1', { chainId: 1, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' } ],
//   [ 'WBTC-1', { chainId: 1, symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' } ],
//   [ 'LINK-1', { chainId: 1, symbol: 'LINK', name: 'Chainlink', decimals: 18, address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' } ],
//   [ 'MATIC-1', { chainId: 1, symbol: 'MATIC', name: 'Polygon', decimals: 18, address: '0x7D1Afa7B718fb893DB30A3abc0Cfc608AaCfebb0' } ],
//   [ 'PEPE-1', { chainId: 1, symbol: 'PEPE', name: 'Pepe', decimals: 18, address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933' } ],
//   [ 'SHIB-1', { chainId: 1, symbol: 'SHIB', name: 'Shiba Inu', decimals: 18, address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' } ],
//   [ 'FLOKI-1', { chainId: 1, symbol: 'FLOKI', name: 'Floki', decimals: 9, address: '0x43F11C02439E2736800433B4594994BD43CD066D' } ],

//   // Polygon (MATIC Mainnet - ChainId 137)
//   [ 'MATIC-137', { chainId: 137, symbol: 'MATIC', name: 'Polygon', decimals: 18, address: '0x7D1Afa7B718fb893DB30A3abc0Cfc608AaCfebb0' } ],
//   [ 'USDC-137', { chainId: 137, symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' } ],
//   [ 'DAI-137', { chainId: 137, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' } ],
//   [ 'LINK-137', { chainId: 137, symbol: 'LINK', name: 'Chainlink', decimals: 18, address: '0x53E0bca35ec356BD5ddDFa6eeb6eDbFfe60aBe0D' } ],

//   // Binance Smart Chain (ChainId 56)
//   [ 'USDT-56', { chainId: 56, symbol: 'USDT', name: 'Tether', decimals: 18, address: '0x55d398326f99059fF775485246999027B3197955' } ],
//   [ 'DAI-56', { chainId: 56, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3' } ],
// ] );

// // Utility function to add a new token
// export function addToken( chainId: number, symbol: string, tokenData: Omit<SwapToken, 'symbol' | 'chainId'> ): void {
//   const key = `${ symbol.toUpperCase() }-${ chainId }`;
//   if ( !commonTokens.has( key ) ) {
//     commonTokens.set( key, { chainId, symbol, ...tokenData } );
//   }
// }

// // Utility function to update a token's data
// export function setToken( chainId: number, symbol: string, tokenData: Omit<SwapToken, 'symbol' | 'chainId'> ): void {
//   const key = `${ symbol.toUpperCase() }-${ chainId }`;
//   commonTokens.set( key, { chainId, symbol, ...tokenData } );
// }

// // Function to fetch token by symbol
// export function getToken( symbol: string, chainId: number ) {
//   const key = `${ symbol.toUpperCase() }-${ chainId }`;
//   return commonTokens.get( key ) || null;
// }

// export function saveTokenListToLocalStorage() {
//   const tokensArray = Array.from( commonTokens.entries() );
//   localStorage.setItem( 'tokenList', JSON.stringify( tokensArray ) );
// }

// export function loadTokenListFromLocalStorage() {
//   const storedTokens = localStorage.getItem( 'tokenList' );
//   if ( storedTokens ) {
//     const tokensArray: [ TokenKey, SwapToken ][] = JSON.parse( storedTokens );
//     commonTokens.clear();
//     tokensArray.forEach( ( [ key, token ] ) => commonTokens.set( key, token ) );
//   }
// }

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

    // debug_log('Default tokens:', defaultTokens);
    // debug_log('Custom tokens:', customTokens);

    // Update the combined tokens store to trigger a single reactive update
    updateCombinedTokenStore();
  } catch (error) {
    console.log('Error updating token balances:', error);
  }
}

export async function updateTokenDataBalances(userAddress: string, provider: ethers.Provider): Promise<TokenData[]> {
  try {
    const tokens = await getYakklTokenData(); // Fetch default tokens from storage or store

    if (!tokens || tokens.length === 0) {
      console.log('No tokens available to update balances');
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
