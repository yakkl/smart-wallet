// src/hooks.client.ts
import { browser_ext } from '$lib/common/environment';
import { handleOnMessageForExtension } from '$lib/common/listeners/ui/uiListeners';
import { syncStorageToStore } from '$lib/common/stores';
import { loadTokens } from '$lib/common/stores/tokens';
import { IdleManager } from '$lib/plugins/IdleManager';
import { log } from '$plugins/Logger';

// Initialize the manager but don't start it yet
const idleManager = IdleManager.initialize({
  width: 'system-wide',
  threshold: 120000,    // 2 minutes until idle
  lockDelay: 60000,     // +1 minute before lockdown
  checkInterval: 15000  // Only for app-wide mode
});

let isInitialized = false;

export async function init() {
  try {
    // Prevent multiple initializations
    if (isInitialized) return;

    log.setLevel('ERROR', 'CONTAINS', ['ERROR', 'INFO', 'WARN', 'DEBUG']);
    log.info("[hooks.client]: Running client-side setup...");

    // Setup listeners first
    await setupGlobalListeners();

    // Start idle manager after other initialization is complete
    idleManager.start();

    isInitialized = true;
    log.info("[hooks.client]: Setup completed successfully");
  } catch (error: any) {
    log.error("[hooks.client] Initialization error:", error);
    handleError(error);
  }
}

export function handleError(error: Error) {
  log.error('[hooks.client] Error:', error);
}

export async function setupGlobalListeners() {
  try {
    const cleanup = () => {
      try {
        log.info("Cleaning up listeners and idle manager...");
        idleManager.stop();

        if (browser_ext.runtime.onMessage.hasListener(handleOnMessageForExtension)) {
          browser_ext.runtime.onMessage.removeListener(handleOnMessageForExtension);
        }

        window.removeEventListener('unload', handleUnload);
        window.removeEventListener('beforeunload', handleUnload);
      } catch (error) {
        log.error("Cleanup error:", error);
      }
    };

    const handleUnload = (event: Event) => {
      log.info("App is closing or reloading...");
      cleanup();
      browser_ext.runtime.sendMessage({ type: 'lockdown' }).catch(log.error);
    };

    // Initialize stores first
    await syncStorageToStore();
    await loadTokens();

    // Then set up message listeners
    if (browser_ext.runtime.onMessage.hasListener(handleOnMessageForExtension)) {
      browser_ext.runtime.onMessage.removeListener(handleOnMessageForExtension);
    }
    browser_ext.runtime.onMessage.addListener(handleOnMessageForExtension);

    log.info('Listener registered status:',
      browser_ext.runtime.onMessage.hasListener(handleOnMessageForExtension)
    );

    // Finally add window listeners
    window.addEventListener('unload', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return cleanup;
  } catch (error) {
    log.error("[hooks.client] Setup listeners error:", error);
    throw error; // Propagate error to init
  }
}

// Export for external use if needed
export { idleManager };

// Example usage:
// In any other component

// import { idleManager } from '../hooks.client';

// Example: Temporarily disable idle detection during an important operation

// async function handleImportantOperation() {
//   idleManager.stop();
//   try {
//     // Do important work
//   } finally {
//     idleManager.start();
//   }
// }

// Example: Switch detection mode

// async function switchToSystemWide() {
//   await idleManager.setStateWidth('system-wide');
// }
