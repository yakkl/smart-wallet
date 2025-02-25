<script lang="ts">
  import { browserSvelte } from '$lib/common/environment';
  import { goto } from '$app/navigation';
  import { resetStores, setMiscStore, setYakklTokenDataCustomStorage, syncStorageToStore, yakklCurrentlySelectedStore, yakklSettingsStore, yakklTokenDataCustomStore } from '$lib/common/stores';
  import { PATH_LOGIN, PATH_LOGOUT } from '$lib/common/constants';

	import type { Settings, YakklCurrentlySelected } from '$lib/common/interfaces';
	import { setIconLock } from '$lib/utilities';
	import { setLocks } from '$lib/common/locks';
	import { removeTimers } from '$lib/common/timers';
	import { removeListeners } from '$lib/common/listeners';
	import { timerManager } from '$lib/plugins/TimerManager';
  import { log } from '$plugins/Logger';
	import { resetTokenDataStoreValues } from '$lib/common/resetTokenDataStoreValues';

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

        // Reset items
        // removeTimers();
        // removeListeners();
        setMiscStore('');
        // resetTokenDataStoreValues();
        // setYakklTokenDataCustomStorage($yakklTokenDataCustomStore); // Zero out values in custom token storage
        // resetStores();
        // await syncStorageToStore();

        // Navigate to the login screen
        // goto(PATH_LOGIN, { replaceState: true, invalidateAll: true });

        // For security reasons, we force a logout. If the customer wants to continue, they must log in again.
        goto(PATH_LOGOUT);
      }
    } catch (e: any) {
      log.error('Locking error:', e, e?.stack);
      if (browserSvelte) {
        try {
          goto(PATH_LOGOUT);
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

