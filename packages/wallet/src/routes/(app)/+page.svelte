<script lang="ts">
	import { goto } from "$app/navigation";
	import { PATH_LEGAL, PATH_LOGIN, PATH_REGISTER } from "$lib/common";
	import type { Settings } from "$lib/common/interfaces";
	import { onMount } from "svelte";

  export let data: {
    yakklSettings: Settings;
    paths: { legal: string; register: string; login: string };
    error: string | null;
  };

  let { yakklSettings, paths, error } = data;

  onMount(() => {
    // Redirect based on settings
    if (!error) {
      if (!yakklSettings?.legal?.termsAgreed) {
        goto(paths?.legal ?? PATH_LEGAL);
      } else if (!yakklSettings?.init) {
        goto(paths?.register ?? PATH_REGISTER);
      } else {
        goto(paths?.login ?? PATH_LOGIN);
      }
    }
  });
</script>

<svelte:head>
  <title>YAKKL Wallet</title>
</svelte:head>

{#if error}
  <code>{error}</code>
{:else if !yakklSettings}
  <p class="mt-3 ml-3 font-bold">Loading options...</p>
{/if}
