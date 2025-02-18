// src/hooks.client.ts
import { browser_ext } from '$lib/common/environment';
import { handleOnMessageForExtension } from '$lib/common/listeners/ui/uiListeners';
import { syncStoresToStorage } from '$lib/common/stores';
import { setStateStore } from '$lib/common/stores/stateStore';
import { loadTokens } from '$lib/common/stores/tokens';
import { log } from '$plugins/Logger';

export function init() {
  log.setLevel('ERROR', 'CONTAINS', ['DEBUG', 'ERROR', 'WARN']); // Nothing greater than ERROR (e.g. TRACE)
  // log.setLogFilterEnabled(false); // Disable log filtering
  // log.setLogFilterRegex("^\\*\\*\\*\\*");

  log.info("[Init]: Running client-side setup...");

  setStateStore(false); // On initial load, set state to false. NOTE: This may go away soon.
  setupGlobalListeners();
}

export function handleError(error: Error) {
  log.error(error);
}

export async function setupGlobalListeners() {
  function handleUnload(event: Event) {
    log.info("App is closing or reloading...");
    browser_ext.runtime.sendMessage({ type: 'lockdown' });
  }

  await syncStoresToStorage();
  loadTokens();

  if (!browser_ext.runtime.onMessage.hasListener(handleOnMessageForExtension)) {
    browser_ext.runtime.onMessage.addListener(handleOnMessageForExtension);
  }

  window.addEventListener('unload', handleUnload);
  window.addEventListener('beforeunload', handleUnload);

  return () => {
    if (browser_ext.runtime.onMessage.hasListener(handleOnMessageForExtension)) {
      browser_ext.runtime.onMessage.removeListener(handleOnMessageForExtension);
    }

    window.removeEventListener('unload', handleUnload);
    window.removeEventListener('beforeunload', handleUnload);
  };
}

