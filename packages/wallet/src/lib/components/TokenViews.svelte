<script lang="ts">
  // svelte-ignore options_renamed_ssr_dom
  import ViewControls from './ViewControls.svelte';
  import TokenGridView from './TokenGridView.svelte';
  import TokenChartsView from './TokenChartsView.svelte';
  import TokenNewsTradingView from './TokenNewsTradingView.svelte';
  import TokenTechnicalView from './TokenTechnicalView.svelte';
  import TokenSymbolView from './TokenSymbolView.svelte';
  // import { tokenManager } from '$lib/common/stores/tokenManager';
  // import { createPriceUpdater } from '$lib/common/createPriceUpdater';
  // import { PriceManager } from '$lib/plugins/PriceManager';
  import { onMount } from 'svelte';
  import type { TokenData } from '$lib/common/interfaces';
  import { log } from '$plugins/Logger';
	// import { TimerManager } from '$lib/plugins/TimerManager';
	import { yakklCombinedTokenStore } from '$lib/common/stores';

  let tokens: TokenData[] = [];
  let sortedTokens: TokenData[] = $state([]);
  let currentView = $state('grid');
  let sortBy = 'name';

  onMount(() => {
    log.debug('<=========================== TokenViews: onMount =================================>');

    // Subscribe to token store updates
    const unsubscribeYakklStore = yakklCombinedTokenStore.subscribe((updatedTokens = []) => {
      tokens = updatedTokens;
      log.debug('TokenViews: updated token prices:', tokens); // JSON.stringify(tokens, null, 2));  // Added JSON.stringify for better readability
      handleSortChange(sortBy);
    });

    return () => {
      unsubscribeYakklStore();
    };
  });

  // Sort tokens based on criteria
  function handleSortChange(criteria: string) {
    sortBy = criteria;
    sortedTokens = [...tokens].sort((a, b) => {
      if (criteria === 'name') return a.name.localeCompare(b.name);
      if (criteria === 'price') return (b.price?.price ?? 0) - (a.price?.price ?? 0);
      if (criteria === 'value') return (b.value ?? 0) - (a.value ?? 0);
      return 0;
    });
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
