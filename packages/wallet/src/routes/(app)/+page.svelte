<script lang="ts">
  import Legal from './legal/Legal/+page.svelte';

  export let data: {
    yakklSettings: any;
    error: string | null;
  };

  let { yakklSettings, error } = data;
</script>

<svelte:head>
  <title>YAKKL Wallet</title>
</svelte:head>

{#if error}
  <code>{error}</code>
{:else if !yakklSettings}
  <p class="mt-3 ml-3 font-bold">Loading options...</p>
{:else}
  {#if !yakklSettings.legal?.termsAgreed}
    <Legal />
  {:else}
    <p>Welcome to YAKKL Wallet</p>
  {/if}
{/if}
