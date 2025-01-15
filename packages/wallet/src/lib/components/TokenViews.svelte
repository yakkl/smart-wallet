<script lang="ts">
  // svelte-ignore options_renamed_ssr_dom
  import ViewControls from './ViewControls.svelte';
  import TokenGridView from './TokenGridView.svelte';
  import TokenChartsView from './TokenChartsView.svelte';
  import TokenNewsTradingView from './TokenNewsTradingView.svelte';
  import TokenTechnicalView from './TokenTechnicalView.svelte';
  import TokenSymbolView from './TokenSymbolView.svelte';
  import { tokenManager } from '$lib/common/stores/tokenManager';
  import { createPriceUpdater } from '$lib/common/createPriceUpdater';
  import { PriceManager } from '$lib/plugins/PriceManager';
  import { onMount } from 'svelte';
  import type { TokenData } from '$lib/common/interfaces';

  let tokens: TokenData[] = [];
  let sortedTokens: TokenData[] = [];
  let currentView = 'grid';
  let sortBy = 'name';

  let priceManager = new PriceManager();
  let priceUpdater = createPriceUpdater(priceManager, 30000);

  onMount(() => {
    // Subscribe to the combined token store
    const unsubscribeTokenManager = tokenManager.subscribe((allTokens = []) => {
      tokens = allTokens;
      handleSortChange(sortBy);
      if (tokens.length > 0) {
        priceUpdater.fetchPrices(tokens).catch(console.log);
      }
    });

    // Subscribe to the price updater
    const unsubscribePriceUpdater = priceUpdater.subscribe((updatedTokens = []) => {
      tokens = updatedTokens;
      handleSortChange(sortBy);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeTokenManager();
      unsubscribePriceUpdater();
      priceUpdater.destroy();
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
      <TokenGridView tokens={sortedTokens} onTokenClick={(token) => console.log('Clicked:', token)} /> <!-- default onTokenClick for future -->
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
