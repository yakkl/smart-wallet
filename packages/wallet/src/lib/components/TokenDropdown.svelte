<!-- TokenDropdown.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwapToken as Token } from '$lib/common/interfaces';

  export let tokens: Token[];
  export let selectedToken: Token;
  export let disabled: boolean = false;
  export let onTokenSelect: (token: Token) => void;

  let isOpen = false;
  let searchQuery = '';
  let filteredTokens: Token[] = [];

  function toggleDropdown() {
    // Prevent opening if disabled
    if (disabled) return;

    isOpen = !isOpen;
    if (isOpen) {
      searchQuery = '';
      filteredTokens = tokens;
    }
  }

  function selectToken(token: Token) {
    // Prevent selection if disabled
    if (disabled) return;
    
    selectedToken = token;
    onTokenSelect(token);
    isOpen = false;
    searchQuery = '';
  }

  function getLogoURL(logoURI: string | null | undefined): string {    
    if (!logoURI || logoURI.startsWith('http://') || logoURI.startsWith('ipfs://')) {
      return '/images/logoBullFav32x32.png';
    }
    return logoURI!;
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

<div class="relative w-full max-w-sm mx-auto">
  <button class="w-full flex items-center px-4 py-3
    {disabled 
      ? 'bg-gray-500 text-gray-200 cursor-not-allowed ' 
      : 'bg-purple-600 text-white hover:bg-purple-700 '} 
      font-bold rounded-full transition duration-300 ease-in-out focus:outline-none" on:click={toggleDropdown} disabled={disabled}>
    {#if selectedToken && selectedToken.symbol && selectedToken.name}
      <img src={getLogoURL(selectedToken.logoURI)} alt={selectedToken.name} class="w-8 h-8 rounded-full" />
      <div class="flex-1 flex flex-col ml-3">
        <span class="font-bold text-lg">{selectedToken.symbol}</span>
        <span class="text-sm text-gray-200 mt-0.5">{selectedToken.name}</span>
      </div>
    {:else}
      <span class="ml-3">Select Token</span>
    {/if}
    <svg xmlns="http://www.w3.org/2000/svg" class="ml-auto h-5 w-5 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </button>
  
  {#if isOpen && !disabled}
    <div class="absolute z-10 w-full bg-white dark:text-gray-600 rounded-md shadow-lg mt-2 p-2 border border-gray-200">
      <input
        type="text"
        placeholder="Search..."
        class="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition duration-200"
        value={searchQuery}
        on:input={handleSearch}
      />
      <ul class="max-h-60 overflow-y-auto w-full">
        {#each filteredTokens as token}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <li
            class="px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 cursor-pointer transition duration-200"
            on:click={() => selectToken(token)}
          >
            <img src={getLogoURL(token.logoURI)} alt={token.name} class="w-8 h-8 rounded-full" />
            <div class="flex-1 flex flex-col">
              <span class="font-bold text-gray-800">{token.symbol}</span>
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

