<script lang="ts">
	import { goto } from "$app/navigation";
	import { PATH_LEGAL, PATH_LOGIN, PATH_REGISTER } from "$lib/common";
  import { getSettings } from "$lib/common/stores";
	import { onMount } from "svelte";
  import { log } from '$plugins/Logger';

  onMount(async () => {
    try {
      // Redirect based on settings
      const yakklSettings = await getSettings();
      if (!yakklSettings.legal.termsAgreed) {
        return await goto(PATH_LEGAL);
      } else if (!yakklSettings.init) {
        // Could check for accountsStore.length > 0 and address !== zero_address
        return await goto(PATH_REGISTER);
      } else {
        return await goto(PATH_LOGIN);
      }
    } catch (error) {
      log.error('+page.svelte (app level) - redirecting to legal:', error);
      return await goto(PATH_LEGAL);
    }
  });
</script>

<svelte:head>
  <title>YAKKL Wallet</title>
</svelte:head>

