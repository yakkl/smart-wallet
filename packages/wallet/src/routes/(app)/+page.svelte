<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import Legal from './legal/Legal/+page.svelte';
  import { getSettings, syncStoresToStorage } from '$lib/common/stores';
  import { DEFAULT_TITLE, PATH_LOGIN, PATH_REGISTER, type Settings } from '$lib/common';
  import { goto } from '$app/navigation';

  let yakklSettings: Settings | null;
  let error: Error | undefined = undefined;

  // Function to fetch the updated settings
  async function fetchYakklSettings() {
    if (browserSvelte) {
      try {
        yakklSettings = await getSettings();
        if (yakklSettings !== null) {
          if (yakklSettings.init === true) {
            syncStoresToStorage().then();  // This is called in login too
          }
        } else {
          goto(PATH_REGISTER);
        }
      } catch (e) {
        error = e as Error;
      }
    }
  }

  fetchYakklSettings();
</script>

<svelte:head>
  <title>{DEFAULT_TITLE}</title>
</svelte:head>

{#if error}
  <code>{error.message}</code>
{:else if !yakklSettings}
  <p class="mt-3 ml-3 font-bold">Loading options...</p>
{:else}
  {#if yakklSettings.legal?.termsAgreed === false}
    <Legal />
  {:else if yakklSettings.init === false}
    {goto(PATH_REGISTER)}
  {:else}
    {goto(PATH_LOGIN)}
  {/if}
{/if}
