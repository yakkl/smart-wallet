<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import { getYakklCurrentlySelected, setMiscStore } from '$lib/common/stores';
  import { getSettings, setSettings, setYakklCurrentlySelectedStorage } from '$lib/common/stores';
  import { setIconLock } from '$lib/utilities/utilities';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
	import type { Settings, YakklCurrentlySelected } from '$lib/common';
  let browser_ext: Browser; 
  if (browserSvelte) browser_ext = getBrowserExt();


  async function update() {
    try {
      if (browserSvelte) {
        setMiscStore(''); // Only lives as long as the browser session
        await setIconLock();

        let yakklSettings: Settings | null = await getSettings();
        if (yakklSettings !== null) {
          yakklSettings.isLocked = true;
          await setSettings(yakklSettings);
        }

        let currentlySelected: YakklCurrentlySelected = await getYakklCurrentlySelected();
        currentlySelected.shortcuts.isLocked = true;
        await setYakklCurrentlySelectedStorage(currentlySelected); // Leaves the last current record and locks it
        // posthog.capture('yakkl_logout', {'how': 'logout'});
        // posthog.reset();
        browser_ext.runtime.reload(); //???
      }
    } catch (e) {
      console.log(e);   
    } finally {
      window.close();
    }
  }

  (async () => {
    if (typeof browserSvelte !== 'undefined' && browserSvelte) {
      await update();
    }
  })();
</script>
