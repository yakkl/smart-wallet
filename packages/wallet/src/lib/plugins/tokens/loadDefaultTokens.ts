import type { TokenStorage } from '$lib/common/interfaces'; // Assume the minimal TokenStorage interface is in a file
import { setYakklTokensStorage } from '$lib/common/stores';
import defaultTokens from './defaultTokens.json';

/**
 * Load default tokens from JSON and populate setYakklTokensStorage.
 */
export async function loadDefaultTokens(): Promise<void> {
  try {
    // Validate and transform each token from JSON
    const tokens: TokenStorage[] = defaultTokens.map((token: any) => {
      if (!validateToken(token)) {
        throw new Error(`Invalid token data: ${JSON.stringify(token)}`);
      }
      return {
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        chainId: token.chainId,
        isNative: token.isNative || false,
        isStablecoin: token.isStablecoin || false,
        logoURI: token.logoURI || '',
        description: token.description || '',
        balance: 0n,
      };
    });

    // Update the storage and store
    setYakklTokensStorage(tokens);
    console.log('Default tokens loaded successfully:', setYakklTokensStorage);
  } catch (error) {
    console.log('Failed to load default tokens:', error);
  }
}

/**
 * Validate token data to ensure it matches the expected structure.
 */
function validateToken(token: any): boolean {
  return (
    typeof token.address === 'string' &&
    typeof token.name === 'string' &&
    typeof token.symbol === 'string' &&
    typeof token.decimals === 'number' &&
    typeof token.chainId === 'number' &&
    typeof token.logoURI === 'string'
  );
}
