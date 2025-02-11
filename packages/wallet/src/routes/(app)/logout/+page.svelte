<script lang="ts">
  import { browserSvelte } from '$lib/common/environment';
  import { resetStores, setMiscStore, yakklCurrentlySelectedStore, yakklSettingsStore } from '$lib/common/stores';
  import { setSettings, setYakklCurrentlySelectedStorage } from '$lib/common/stores';
  import { setIconLock } from '$lib/utilities/utilities';

  import { debug_log, type Settings, type YakklCurrentlySelected } from '$lib/common';
  import { browser_ext } from '$lib/common/environment';
	import { setStateStore } from '$lib/common/stores/stateStore';
	import { removeTimers } from '$lib/common/timers';
	import { removeListeners } from '$lib/common/listeners';

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

      // Update Yakkl settings
      if (yakklSettings && !yakklSettings.isLocked) {
        yakklSettings.isLocked = true;
        await setSettings(yakklSettings);
      }

      // Lock currently selected shortcuts
      if (yakklCurrentlySelected && yakklCurrentlySelected.shortcuts?.isLocked === false) {
        yakklCurrentlySelected.shortcuts.isLocked = true;
        await setYakklCurrentlySelectedStorage(yakklCurrentlySelected);
      }

      // Clear session-specific state
      removeTimers();
      removeListeners();
      setStateStore(false);
      setMiscStore('');
      resetStores();

      // Reload the browser extension
      browser_ext.runtime.reload();
    } catch (e) {
      console.log('[ERROR]: Logout failed:', e);
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
