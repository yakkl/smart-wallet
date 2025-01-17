import { derived } from 'svelte/store';
import { throttle } from 'lodash-es';
import { yakklTokenDataStore, yakklTokenDataCustomStore } from './stores';

const combinedTokenStore = derived(
  [yakklTokenDataStore, yakklTokenDataCustomStore],
  throttle(([$yakklTokenDataStore, $yakklTokenDataCustomStore]) => {
    if (!$yakklTokenDataStore.length && !$yakklTokenDataCustomStore.length) {
      return [];
    }
    return [...$yakklTokenDataStore, ...$yakklTokenDataCustomStore];
  }, 100) // Throttle updates to 100ms
);

export { combinedTokenStore };
