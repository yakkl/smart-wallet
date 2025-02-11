<script lang="ts">
	import { goto } from "$app/navigation";
	import { debug_log, PATH_LEGAL, PATH_LOGIN, PATH_REGISTER } from "$lib/common";
  import { getSettings, yakklAccountsStore } from "$lib/common/stores";
	import { onMount } from "svelte";

  onMount(async () => {
    try {
      // Redirect based on settings
      const yakklSettings = await getSettings();
      debug_log('[INFO]: +page.svelte (app level): yakklSettings, accountsStore', yakklSettings, $yakklAccountsStore);

      if (!yakklSettings.legal.termsAgreed) {
        return await goto(PATH_LEGAL);
      } else if (!yakklSettings.init) {
        // Could check for accountsStore.length > 0 and address !== zero_address
        return await goto(PATH_REGISTER);
      } else {
        return await goto(PATH_LOGIN);
      }
    } catch (error) {
      console.log('[ERROR]: +page.svelte (app level):', error);
      return await goto(PATH_LEGAL);
    }
  });
</script>

<svelte:head>
  <title>YAKKL Wallet</title>
</svelte:head>

