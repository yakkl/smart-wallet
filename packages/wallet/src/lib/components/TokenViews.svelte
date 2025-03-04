<script lang="ts">
  // svelte-ignore options_renamed_ssr_dom
  import ViewControls from './ViewControls.svelte';
  import TokenGridView from './TokenGridView.svelte';
  import TokenChartsView from './TokenChartsView.svelte';
  import TokenNewsTradingView from './TokenNewsTradingView.svelte';
  import TokenTechnicalView from './TokenTechnicalView.svelte';
  import TokenSymbolView from './TokenSymbolView.svelte';
  import type { TokenData } from '$lib/common/interfaces';
  import { log } from '$plugins/Logger';
	import { yakklCombinedTokenStore } from '$lib/common/stores';
  import LoadingState from './LoadingState.svelte';
	import { onMount } from 'svelte';
  import { sessionInitialized } from '$lib/common/stores';

  let tokens = $state<TokenData[]>([]);
  let sortedTokens = $state<TokenData[]>([]);
  let currentView = $state('grid');
  let sortBy = $state('name');
  let isLoading = $state(false); // This should only be true during initial load

  // Store subscription
  yakklCombinedTokenStore.subscribe((updatedTokens = []) => {
    tokens = updatedTokens;
    handleSortChange(sortBy);
  });

  onMount(() => {
    // Always start loading when component mounts
    if (!$sessionInitialized) {
      isLoading = true;

      const timer = setTimeout(() => {
        isLoading = false;
        sessionInitialized.set(true); // Set to true for current session only
      }, 3000);

      return () => clearTimeout(timer);
    }
  });

  // Separate effect for sorting
  $effect(() => {
    if (tokens.length > 0) {
      sortedTokens = [...tokens].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price') return (b.price?.price ?? 0) - (a.price?.price ?? 0);
        if (sortBy === 'value') return (b.value ?? 0) - (a.value ?? 0);
        return 0;
      });
    }
  });

  // Simplified sort handler
  function handleSortChange(criteria: string) {
    sortBy = criteria;
  }

  // Change the current view
  function handleViewChange(view: string) {
    currentView = view;
  }

   // Print handler - basic stub for now. Need to format for print within each view.
  function handlePrint() {
    window.print();
  }
</script>

<div class="w-full h-full mt-1">
  <!-- Header Section -->
  <div class="flex justify-between items-center px-2 py-1">
    <h2 class="text-lg font-bold text-gray-300">Token Portfolio</h2>
    <ViewControls onSortChange={handleSortChange} onViewChange={handleViewChange} onPrint={handlePrint} />
  </div>

  <!-- Dynamic Views -->
  <div class="relative rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 shadow-lg">
    {#if isLoading && !$sessionInitialized}
      <LoadingState message="Analyzing Tokens..." />
    {/if}

    {#if currentView === 'grid'}
      <TokenGridView tokens={sortedTokens} onTokenClick={(token) => log.info('Clicked:', token)} /> <!-- default onTokenClick for future -->
    {:else if currentView === 'chart'}
      <TokenChartsView />
    {:else if currentView === 'news'}
      <TokenNewsTradingView />
    {:else if currentView === 'analysis'}
      <TokenTechnicalView symbol="CRYPTO:ETHUSD" />
    {:else if currentView === 'symbol'}
      {#each sortedTokens as token}
        <TokenSymbolView symbol={`CRYPTO:${token.symbol.toUpperCase()}USD`} />
      {/each}
    {/if}
  </div>
</div>
