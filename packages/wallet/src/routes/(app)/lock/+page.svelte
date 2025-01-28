<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  import { goto } from '$app/navigation';
  import { getYakklCurrentlySelected, setMiscStore, syncStoresToStorage } from '$lib/common/stores';
  import { getSettings, setSettings, setYakklCurrentlySelectedStorage } from '$lib/common/stores';
  import { PATH_LOGIN, PATH_LOGOUT } from '$lib/common/constants';

	import type { Settings, YakklCurrentlySelected } from '$lib/common/interfaces';
	import { setIconLock } from '$lib/utilities';
	import { stopTimers } from '$lib/extensions/chrome/timers';
	import { globalListenerManager } from '$lib/plugins/GlobalListenerManager';

 let isUpdating = false;

  async function update() {
    if (isUpdating) return;
    isUpdating = true;

    try {
      if (browserSvelte) {
        setMiscStore('Locking your account...');
        const yakklSettings = await getSettings();
        if (yakklSettings && !yakklSettings.isLocked) {
          yakklSettings.isLocked = true;
          await setSettings(yakklSettings);
        }

        const currentlySelected: YakklCurrentlySelected = await getYakklCurrentlySelected();
        if (currentlySelected.shortcuts?.isLocked === false) {
          currentlySelected.shortcuts.isLocked = true;
          await setYakklCurrentlySelectedStorage(currentlySelected);
        }

        // Update lock icon
        await setIconLock();

        // Stop all active timers
        await stopTimers();

        // Remove all registered listeners
        globalListenerManager.removeAll();

        // Sync all stores to ensure storage is updated
        await syncStoresToStorage();

        // Navigate to the login screen
        await goto(PATH_LOGIN, { invalidateAll: true });
        // For security, it we should use logout instead of lock.
      }
    } catch (e: any) {
      console.log('[ERROR]: Locking error:', e, e?.stack);
      if (browserSvelte) {
        try {
          await goto(PATH_LOGOUT);
        } catch (err) {
          console.error('[ERROR]: Navigation to logout failed:', err);
        }
      }
    } finally {
      isUpdating = false; // Release the lock
    }
  }

  (async () => {
    if (typeof browserSvelte !== 'undefined' && browserSvelte) {
      await update();
    }
  })();
</script>

