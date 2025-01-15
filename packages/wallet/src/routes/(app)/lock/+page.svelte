<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  // import { browser as browserSvelte } from '$app/environment';
  import { goto } from '$app/navigation';
  import { getYakklCurrentlySelected, setMiscStore } from '$lib/common/stores';
  import { getSettings, setSettings, setYakklCurrentlySelectedStorage } from '$lib/common/stores';
  import { PATH_LOGIN } from '$lib/common/constants';

	import type { Settings, YakklCurrentlySelected } from '$lib/common/interfaces';
	import { setIconLock } from '$lib/utilities';

  async function update() {
    try {
      if (browserSvelte) {
        setMiscStore('Locking your account...');
        let yakklSettings: Settings | null = await getSettings();
        if (yakklSettings !== null) {
          yakklSettings.isLocked = true;
          await setSettings(yakklSettings);
        }
        let currentlySelected: YakklCurrentlySelected = await getYakklCurrentlySelected();
        currentlySelected.shortcuts.isLocked = true;
        await setYakklCurrentlySelectedStorage(currentlySelected); // Leaves the last current record and locks it
        // Set the lock icon
        await setIconLock();
      }
    } catch (e) {
        console.log(e);
    } finally {
      goto(PATH_LOGIN);
    }
  }

  (async () => {
    if (typeof browserSvelte !== 'undefined' && browserSvelte) {
      await update();
    }
  })();
</script>

