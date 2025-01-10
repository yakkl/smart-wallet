<script lang="ts">
  import ViewControls from './ViewControls.svelte';
  import TokenGridView from './TokenGridView.svelte';
  import TokenChartsView from './TokenChartsView.svelte';
  import TokenNewsTradingView from './TokenNewsTradingView.svelte';
  import TokenTechnicalView from './TokenTechnicalView.svelte';
  import TokenSymbolView from './TokenSymbolView.svelte';
  import { tokenManager } from '$lib/common/stores/tokenManager';
  import type { TokenData } from '$lib/common/interfaces';
  import { createPriceUpdater } from '$lib/common/createPriceUpdater';
  import { PriceManager } from '$lib/plugins/PriceManager';
  import { onMount, onDestroy } from 'svelte';

  let tokens: TokenData[] = []; // Reactive tokens array
  let sortedTokens: TokenData[] = []; // Sorted version of tokens
  let currentView: 'grid' | 'chart' | 'news' | 'analysis' | 'symbol' | 'carousel' | 'thumbnail' | 'list' | 'table' = 'grid'; // Reactive current view
  let sortBy: string = 'name'; // Sort criteria

  // Initialize PriceManager
  let priceManager = new PriceManager();
  // Create priceUpdater instance
  const priceUpdater = createPriceUpdater(priceManager, 30000); // Fetch every 30 seconds

  onMount(() => {
    // Subscribe to tokenManager to get the initial list of tokens
    const tokenManagerUnsubscribe = tokenManager.subscribe((allTokens) => {
      tokens = [...allTokens]; // Clone tokens to avoid reference issues
      sortedTokens = [...tokens]; // Default sorted tokens
      priceUpdater.fetchPrices(tokens).catch(console.error); // Fetch initial prices
    });

    // Subscribe to priceUpdater to update tokens with prices
    const priceUpdaterUnsubscribe = priceUpdater.subscribe((updatedTokens) => {
      tokens = updatedTokens; // Update tokens with prices
      handleSortChange(sortBy); // Reapply sorting on price updates
    });

    return () => {
      // Cleanup subscriptions
      tokenManagerUnsubscribe();
      priceUpdaterUnsubscribe();
      priceUpdater.destroy(); // Stop the price updater interval
    };
  });

  // Sorting handler
  function handleSortChange(criteria: string) {
    sortBy = criteria;

    // Sort tokens based on criteria
    sortedTokens = [...tokens].sort((a, b) => {
      if (criteria === 'name') return a.name.localeCompare(b.name);
      if (criteria === 'price') return (b?.price?.price || 0) - (a?.price?.price || 0);
      if (criteria === 'value') return (b.value || 0) - (a.value || 0);
      return 0;
    });
  }

  // View change handler
  function handleViewChange(view: 'grid' | 'chart' | 'news' | 'analysis' | 'symbol' | 'carousel' | 'thumbnail' | 'list' | 'table') {
    currentView = view; // Update the current view
  }

  // Print handler
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
      <TokenGridView tokens={sortedTokens} onTokenClick={(token) => console.log('Clicked:', token)} />
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
