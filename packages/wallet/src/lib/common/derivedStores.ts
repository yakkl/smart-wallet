import { derived } from 'svelte/store';
import { throttle } from 'lodash-es';
import { yakklTokenDataStore, yakklTokenDataCustomStore } from './stores';
import { debug_log } from './debug-error';

const combinedTokenStore = derived(
  [yakklTokenDataStore, yakklTokenDataCustomStore],
  throttle(([$yakklTokenDataStore, $yakklTokenDataCustomStore]) => {

    debug_log('combinedTokenStore', $yakklTokenDataStore, $yakklTokenDataCustomStore);

    if (!$yakklTokenDataStore.length && !$yakklTokenDataCustomStore.length) {
      return [];
    }
    return [...$yakklTokenDataStore, ...$yakklTokenDataCustomStore];
  }, 100) // Throttle updates to 100ms
);

export { combinedTokenStore };
