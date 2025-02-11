// src/hooks.client.ts
import { browser_ext } from '$lib/common/environment';
import { handleOnMessageForExtension } from '$lib/common/listeners/ui/uiListeners';
import { syncStoresToStorage } from '$lib/common/stores';
import { setStateStore } from '$lib/common/stores/stateStore';
import { loadTokens } from '$lib/common/stores/tokens';

export function init() {
  console.log("[Init]: Running client-side setup...");
  setStateStore(false); // On initial load, set state to false. NOTE: This may go away soon.
  setupGlobalListeners();
}

export function handleError(error: Error) {
  console.log("[ERROR]:", error);
}

export async function setupGlobalListeners() {
  function handleUnload(event: Event) {
    console.log("App is closing or reloading...");
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

