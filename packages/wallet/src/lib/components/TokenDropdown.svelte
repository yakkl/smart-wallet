<!-- TokenDropdown.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwapToken as Token } from '$lib/common/interfaces';

  export let tokens: Token[];
  export let selectedToken: Token | null;
  export let onTokenSelect: (token: Token | null) => void;

  let isOpen = false;
  let searchQuery = '';
  let filteredTokens: Token[] = [];

  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      searchQuery = '';
      filteredTokens = tokens;
    }
  }

  function selectToken(token: Token | null) {
    selectedToken = token;
    onTokenSelect(token);
    isOpen = false;
    searchQuery = '';
  }

  function getLogoURL(logoURI: string): string {
    if (logoURI.startsWith('http://') || logoURI.startsWith('ipfs://')) {
      return '/images/logoBullFav-BW32x32.png';
    }
    return logoURI;
  }

  function handleSearch(event: Event) {
    searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    filterTokens();
  }

  function filterTokens() {
    filteredTokens = tokens.filter(token =>
      token.symbol.toLowerCase().includes(searchQuery) ||
      token.name.toLowerCase().includes(searchQuery) ||
      token.chainId.toString() === searchQuery
    );
  }

  onMount(() => {
    filterTokens();
  });
</script>

<div class="relative w-full">
  <button class="select select-bordered w-full max-w-xs flex items-center space-x-2 px-4 py-2" on:click={toggleDropdown}>
    {#if selectedToken}
      <img src={getLogoURL(selectedToken.logoURI)} alt={selectedToken.name} class="w-6 h-6 rounded-full" />
      <div class="flex-1 flex flex-col justify-center">
        <span class="font-bold text-lg text-gray-300">{selectedToken.symbol}</span>
        <span class="text-sm text-gray-400 mt-0">{selectedToken.name}</span>
      </div>
      <!-- <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg> -->
    {:else}
      Select token
    {/if}
  </button>
  {#if isOpen}
    <div class="absolute z-10 w-full bg-white rounded-md shadow-lg mt-1">
      <input
        type="text"
        placeholder="Search..."
        class="w-full px-4 py-2 border-b border-gray-200 focus:outline-none"
        value={searchQuery}
        on:input={handleSearch}
      />
      <ul class="max-h-60 overflow-y-auto w-full">
        {#each filteredTokens as token}
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <li
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
            on:click={() => selectToken(token)}
          >
            <img src={getLogoURL(token.logoURI)} alt={token.name} class="w-6 h-6 rounded-full" />
            <div class="flex-1 flex flex-col justify-center">
              <span class="font-bold text-lg text-gray-800">{token.symbol}</span>
              <span class="text-sm text-gray-600">{token.name}</span>
            </div>
          </li>
        {:else}
          <li class="px-4 py-2 text-gray-500">No tokens found</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
