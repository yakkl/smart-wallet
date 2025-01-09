import { writable, derived } from 'svelte/store';
import { yakklTokenDataStore, yakklTokenDataCustomStore } from '../stores'; // Assuming these are your stores
import type { TokenData } from '../interfaces';

const defaultTokens = writable<TokenData[]>([]);
const customTokens = writable<TokenData[]>([]);

// Sync defaultTokens and customTokens with their respective yakkl stores
yakklTokenDataStore.subscribe((tokens: TokenData[]) => defaultTokens.set(tokens));
yakklTokenDataCustomStore.subscribe((tokens: TokenData[]) => customTokens.set(tokens));

// Combine defaultTokens and customTokens into a single reactive store
const combinedTokenStore = derived(
  [defaultTokens, customTokens],
  ([$defaultTokens, $customTokens]) => [...$defaultTokens, ...$customTokens]
);

function createTokenManager() {
  return {
    subscribe: combinedTokenStore.subscribe,
    addToken: (token: TokenData, isCustom = false) => {
      if (isCustom) {
        customTokens.update((tokens) => [...tokens, token]);
      } else {
        defaultTokens.update((tokens) => [...tokens, token]);
      }
    },
    reset: () => {
      defaultTokens.set([]);
      customTokens.set([]);
    },
  };
}

export const tokenManager = createTokenManager();
