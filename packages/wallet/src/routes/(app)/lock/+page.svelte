<script lang="ts">
  import { browserSvelte } from '$lib/common/environment';
  import { goto } from '$app/navigation';
  import { resetStores, setMiscStore, syncStoresToStorage, yakklCurrentlySelectedStore, yakklSettingsStore } from '$lib/common/stores';
  import { PATH_LOGIN, PATH_LOGOUT } from '$lib/common/constants';

	import type { Settings, YakklCurrentlySelected } from '$lib/common/interfaces';
	import { setIconLock } from '$lib/utilities';
	import { setStateStore } from '$lib/common/stores/stateStore';
	import { setLocks } from '$lib/common/locks';
	import { removeTimers } from '$lib/common/timers';
	import { removeListeners } from '$lib/common/listeners';
	import { TimerManager, timerManager } from '$lib/plugins/TimerManager';
  import { log } from '$plugins/Logger';

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

        await setLocks(true);

        log.debug('(before) Showing timer list:', timerManager.listTimers());
        log.debug('(before) Showing running timers:', timerManager.getRunningTimers());

        // Reset stores
        removeTimers();
        TimerManager.clearInstance();
        removeListeners();
        setStateStore(false); // Don't use this at the moment and may remove it
        setMiscStore('');
        resetStores();

        await syncStoresToStorage();

        log.debug('(after) Showing timer list:', timerManager.listTimers());
        log.debug('(after) Showing running timers:', timerManager.getRunningTimers());

        // Navigate to the login screen
        goto(PATH_LOGIN, { replaceState: true, invalidateAll: true });

      }
    } catch (e: any) {
      log.error('Locking error:', e, e?.stack);
      if (browserSvelte) {
        try {
          await goto(PATH_LOGOUT);
        } catch (err) {
          log.error('Navigation to logout failed:', err);
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

