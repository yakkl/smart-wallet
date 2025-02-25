<script lang="ts">
  import { browserSvelte } from '$lib/common/environment';
  import { resetStores, setMiscStore, setYakklTokenDataCustomStorage, yakklCurrentlySelectedStore, yakklSettingsStore, yakklTokenDataCustomStore } from '$lib/common/stores';
  import { setIconLock } from '$lib/utilities/utilities';

  import { type Settings, type YakklCurrentlySelected } from '$lib/common';
  import { browser_ext } from '$lib/common/environment';
	import { removeTimers } from '$lib/common/timers';
	import { removeListeners } from '$lib/common/listeners';
	import { setLocks } from '$lib/common/locks';
	import { resetTokenDataStoreValues } from '$lib/common/resetTokenDataStoreValues';
  import { log } from '$plugins/Logger';

  // Reactive State
  let yakklCurrentlySelected: YakklCurrentlySelected | null = $state(null);
  let yakklSettings: Settings | null = $state(null);

  $effect(() => { yakklCurrentlySelected = $yakklCurrentlySelectedStore; });
  $effect(() => { yakklSettings = $yakklSettingsStore; });

  let isUpdating = false; // Prevent concurrent executions

  async function update() {
    if (isUpdating) return; // Prevent multiple updates
    isUpdating = true;

    try {
      // Set lock icon
      await setIconLock();
      setLocks(true);

      // Clear session-specific state
      removeTimers();
      removeListeners();
      setMiscStore('');
      resetTokenDataStoreValues();
      setYakklTokenDataCustomStorage($yakklTokenDataCustomStore); // Zero out values in custom token storage
      resetStores();

      // Reload the browser extension
      browser_ext.runtime.reload();
    } catch (e) {
      log.error('Logout failed:', e);
      alert('Logout encountered an error. Please try again or refresh the extension manually.');
    } finally {
      isUpdating = false;
      window.close();
    }
  }

  if (browserSvelte) {
    update();
  }
</script>
