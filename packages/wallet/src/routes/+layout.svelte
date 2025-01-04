<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { loadTokens } from '$lib/common/stores/tokens';
	import { setIconLock } from '$lib/utilities';
	import { getObjectFromLocalStorage, setObjectInLocalStorage } from '$lib/common/storage';
	import { dateString } from '$lib/common/datetime';
	import type { Settings } from '$lib/common/interfaces';
	import { yakklSettingsStore } from '$lib/common/stores';

  let { children } = $props();

  onMount(() => {
    loadTokens();

    const handleBeforeUnload = async () => {
      try {
        await setIconLock();
        const yakklSettings: Settings | null | string = await getObjectFromLocalStorage("settings") as Settings;
        if (yakklSettings) {
            yakklSettings.isLocked = true;
            yakklSettings.isLockedHow = 'window_exit';
            yakklSettings.updateDate = dateString();
            yakklSettingsStore.set(yakklSettings);
            await setObjectInLocalStorage('settings', yakklSettings);
        }
      } catch (error) {
        console.log('Error in beforeunload handler:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });
</script>

{@render children?.()}
