<script lang="ts">
  import Legal from './legal/Legal/+page.svelte';
  import { getSettings, syncStoresToStorage } from '$lib/common/stores';
  import { DEFAULT_TITLE, PATH_LOGIN, PATH_REGISTER, type Settings } from '$lib/common';
  import { goto } from '$app/navigation';

  let yakklSettings: Settings | null = $state(null);
  let error: Error | undefined = $state(undefined);

  // Function to fetch the updated settings
  async function fetchYakklSettings() {
    if (typeof window !== 'undefined') { // Check if running in the browser
      try {
        yakklSettings = await getSettings();
        if (yakklSettings) {
          if (yakklSettings.init) {
            await syncStoresToStorage(); // Ensure we wait for this
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
  {#if !yakklSettings.legal?.termsAgreed}
    <Legal />
  {:else if !yakklSettings.init}
    {goto(PATH_REGISTER)}
  {:else}
    {goto(PATH_LOGIN)}
  {/if}
{/if}
