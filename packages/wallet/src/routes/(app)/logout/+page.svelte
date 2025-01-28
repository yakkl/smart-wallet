<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  import { getYakklCurrentlySelected, setMiscStore } from '$lib/common/stores';
  import { getSettings, setSettings, setYakklCurrentlySelectedStorage } from '$lib/common/stores';
  import { setIconLock } from '$lib/utilities/utilities';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
  import type { Browser } from 'webextension-polyfill';
  import { debug_log, type Settings, type YakklCurrentlySelected } from '$lib/common';

  let browser_ext: Browser | null = null;
  if (browserSvelte) browser_ext = getBrowserExt();

  let isUpdating = false; // Prevent concurrent executions

  async function update() {
    if (isUpdating) return; // Prevent multiple updates
    isUpdating = true;

    try {
      // Clear session-specific state
      setMiscStore('');

      // Set lock icon
      await setIconLock();

      // Update Yakkl settings
      const yakklSettings: Settings | null = await getSettings();
      if (yakklSettings) {
        yakklSettings.isLocked = true;
        await setSettings(yakklSettings);
      }

      // Lock currently selected shortcuts
      const currentlySelected: YakklCurrentlySelected = await getYakklCurrentlySelected();
      if (currentlySelected) {
        currentlySelected.shortcuts.isLocked = true;
        await setYakklCurrentlySelectedStorage(currentlySelected);
      }

      // Reload the browser extension
      browser_ext.runtime.reload();
    } catch (e) {
      console.error('[ERROR]: Logout failed:', e);
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
