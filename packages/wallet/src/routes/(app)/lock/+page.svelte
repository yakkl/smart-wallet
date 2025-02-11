<script lang="ts">
  import { browserSvelte, browser_ext } from '$lib/common/environment';
  import { goto } from '$app/navigation';
  import { resetStores, setMiscStore, syncStoresToStorage, yakklCurrentlySelectedStore, yakklSettingsStore } from '$lib/common/stores';
  import { setSettings, setYakklCurrentlySelectedStorage } from '$lib/common/stores';
  import { PATH_LOGIN, PATH_LOGOUT } from '$lib/common/constants';

	import type { Settings, YakklCurrentlySelected } from '$lib/common/interfaces';
	import { setIconLock } from '$lib/utilities';
	import { globalListenerManager } from '$lib/plugins/GlobalListenerManager';
	import { debug_log } from '$lib/common/debug-error';
	import { setStateStore } from '$lib/common/stores/stateStore';
	import { setLocks } from '$lib/common/locks';
	import { removeTimers, stopTimers } from '$lib/common/timers';
	import { removeListeners } from '$lib/common/listeners';

  // Reactive State
  let yakklCurrentlySelected: YakklCurrentlySelected | null = $state(null);
  let yakklSettings: Settings | null = $state(null);

  $effect(() => { yakklCurrentlySelected = $yakklCurrentlySelectedStore; });
  $effect(() => { yakklSettings = $yakklSettingsStore; });

  let isUpdating = false;

  async function update() {
    if (isUpdating) return;
    isUpdating = true;

    try {
      if (browserSvelte) {
        // Update lock icon
        await setIconLock();

        // if (yakklSettings && !yakklSettings.isLocked) {
        //   yakklSettings.isLocked = true;
        //   await setSettings(yakklSettings);
        // }

        // if (yakklCurrentlySelected.shortcuts?.isLocked === false) {
        //   yakklCurrentlySelected.shortcuts.isLocked = true;
        //   await setYakklCurrentlySelectedStorage(yakklCurrentlySelected);
        // }

        await setLocks(true);

        // Reset stores
        removeTimers();
        removeListeners();
        setStateStore(false);
        setMiscStore('');
        resetStores();

        await syncStoresToStorage();

        // Navigate to the login screen
        goto(PATH_LOGIN, { replaceState: true, invalidateAll: true });

      }
    } catch (e: any) {
      console.log('[ERROR]: Locking error:', e, e?.stack);
      if (browserSvelte) {
        try {
          await goto(PATH_LOGOUT);
        } catch (err) {
          console.log('[ERROR]: Navigation to logout failed:', err);
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

