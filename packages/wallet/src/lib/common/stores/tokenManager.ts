import { yakklCombinedTokenStore } from '../stores'; // The new combined token store
import type { TokenData } from '../interfaces';
import { debug_log } from '../debug-error';

function createTokenManager() {
  return {
    // Subscribe to the combined token store
    subscribe: yakklCombinedTokenStore.subscribe,
    // Add a token to the combined store (you may decide whether this should update individual stores instead)
    addToken: (token: TokenData, isCustom = false) => {
      yakklCombinedTokenStore.update((tokens) => [...tokens, token]);
    },
    // Reset all tokens in the combined store
    reset: () => {
      yakklCombinedTokenStore.set([]);
    },
  };
}

export const tokenManager = createTokenManager();
