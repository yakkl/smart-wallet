import type { SwapToken } from './interfaces';
import { get } from 'svelte/store';
import { ethers } from 'ethers';
import { yakklTokensStore, yakklTokensCustomStore, setYakklTokensStorage, setYakklTokensCustomStorage } from '$lib/common/stores';
import { type TokenStorage } from '$lib/common';

type TokenKey = string;

export interface TokenPair {
  tokenIn: SwapToken;
  tokenOut: SwapToken;
}

const commonTokens: Map<TokenKey, SwapToken> = new Map<TokenKey, SwapToken>( [
  // Ethereum Mainnet (ChainId 1)
  [ 'ETH-1', { chainId: 1, symbol: 'ETH', name: 'Ethereum', decimals: 18, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' } ],
  // [ 'USD-1', { chainId: 1, symbol: 'USD', name: 'Ethereum', decimals: 18, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' } ], // Placeholder for USD. Must be present in all L1 and L2 chains
  [ 'WETH-1', { chainId: 1, symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' } ],
  [ 'USDC-1', { chainId: 1, symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' } ],
  [ 'USDT-1', { chainId: 1, symbol: 'USDT', name: 'Tether', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' } ],
  [ 'DAI-1', { chainId: 1, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' } ],
  [ 'WBTC-1', { chainId: 1, symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' } ],
  [ 'LINK-1', { chainId: 1, symbol: 'LINK', name: 'Chainlink', decimals: 18, address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' } ],
  [ 'MATIC-1', { chainId: 1, symbol: 'MATIC', name: 'Polygon', decimals: 18, address: '0x7D1Afa7B718fb893DB30A3abc0Cfc608AaCfebb0' } ],
  [ 'PEPE-1', { chainId: 1, symbol: 'PEPE', name: 'Pepe', decimals: 18, address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933' } ],
  //[ 'DOGE-1', { chainId: 1, symbol: 'DOGE', name: 'Dogecoin', decimals: 8, address: '0xba2ae424d960c26247dd6c32edc70b295c744c43' } ],
  [ 'SHIB-1', { chainId: 1, symbol: 'SHIB', name: 'Shiba Inu', decimals: 18, address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' } ],
  [ 'FLOKI-1', { chainId: 1, symbol: 'FLOKI', name: 'Floki', decimals: 9, address: '0x43F11C02439E2736800433B4594994BD43CD066D' } ],

  // Polygon (MATIC Mainnet - ChainId 137)
  [ 'MATIC-137', { chainId: 137, symbol: 'MATIC', name: 'Polygon', decimals: 18, address: '0x7D1Afa7B718fb893DB30A3abc0Cfc608AaCfebb0' } ],
  // [ 'USD-137', { chainId: 137, symbol: 'USD', name: 'Polygon', decimals: 18, address: '0x7D1Afa7B718fb893DB30A3abc0Cfc608AaCfebb0' } ],
  [ 'USDC-137', { chainId: 137, symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' } ],
  [ 'DAI-137', { chainId: 137, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' } ],
  [ 'LINK-137', { chainId: 137, symbol: 'LINK', name: 'Chainlink', decimals: 18, address: '0x53E0bca35ec356BD5ddDFa6eeb6eDbFfe60aBe0D' } ],

  // Binance Smart Chain (ChainId 56)
  [ 'USDT-56', { chainId: 56, symbol: 'USDT', name: 'Tether', decimals: 18, address: '0x55d398326f99059fF775485246999027B3197955' } ],
  [ 'DAI-56', { chainId: 56, symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3' } ],
] );

// Utility function to add a new token
export function addToken( chainId: number, symbol: string, tokenData: Omit<SwapToken, 'symbol' | 'chainId'> ): void {
  const key = `${ symbol }-${ chainId }`;
  if ( !commonTokens.has( key ) ) {
    commonTokens.set( key, { chainId, symbol, ...tokenData } );
  }
}

// Utility function to update a token's data
export function setToken( chainId: number, symbol: string, tokenData: Omit<SwapToken, 'symbol' | 'chainId'> ): void {
  const key = `${ symbol }-${ chainId }`;
  commonTokens.set( key, { chainId, symbol, ...tokenData } );
}

// Function to fetch token by symbol
export function getToken( symbol: string, chainId: number ) {
  const key = `${ symbol.toUpperCase() }-${ chainId }`;
  return commonTokens.get( key ) || null;
}

export function saveTokenListToLocalStorage() {
  const tokensArray = Array.from( commonTokens.entries() );
  localStorage.setItem( 'tokenList', JSON.stringify( tokensArray ) );
}

export function loadTokenListFromLocalStorage() {
  const storedTokens = localStorage.getItem( 'tokenList' );
  if ( storedTokens ) {
    const tokensArray: [ TokenKey, SwapToken ][] = JSON.parse( storedTokens );
    commonTokens.clear();
    tokensArray.forEach( ( [ key, token ] ) => commonTokens.set( key, token ) );
  }
}

// Example usage:
// updateTokenBalances(userAddress, provider)
//   .then(() => console.log('Balances updated'))
//   .catch((error) => console.error('Error updating balances:', error));

// TODO: Evaluate if this function should be here or in a different file. Also, change to ethers v6 OR our own custom classes
export async function updateTokenBalances(userAddress: string, provider: ethers.providers.Provider): Promise<void> {
  // Retrieve current token lists
  const tokens = get(yakklTokensStore);
  const customTokens = get(yakklTokensCustomStore);

  // Helper function to get balance for a token
  async function getTokenBalance(token: TokenStorage): Promise<string | undefined> {
    try {
      if (!ethers.utils.isAddress(token.address)) {
        console.log(`Invalid token address: ${token.address}`);
        return undefined;
      }

      const tokenContract = new ethers.Contract(
        token.address,
        [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
        ],
        provider
      );

      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();

      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.log(`Failed to get balance for token: ${token.name}`, error);
      return undefined;
    }
  }

  // Update balances for tokens
  const updatedTokens = await Promise.all(
    tokens.map(async (token) => {
      const balance = await getTokenBalance(token);
      return {
        ...token,
        balance: balance !== undefined ? balance : token.balance,
      };
    })
  );

  const updatedCustomTokens = await Promise.all(
    customTokens.map(async (token) => {
      const balance = await getTokenBalance(token);
      return {
        ...token,
        balance: balance !== undefined ? balance : token.balance,
      };
    })
  );

  // Save updated tokens to storage and stores
  setYakklTokensStorage(updatedTokens);
  setYakklTokensCustomStorage(updatedCustomTokens);

  console.log('Token balances updated successfully.');
}

