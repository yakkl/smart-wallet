<script lang="ts">
  import ViewControls from './ViewControls.svelte';
  import TokenGridView from './TokenGridView.svelte';
  import TokenCarouselView from './TokenCarouselView.svelte';
  import TokenThumbnailView from './TokenThumbnailView.svelte';
  import type { TokenData } from '$lib/common/interfaces';
	import TokenChartsView from './TokenChartsView.svelte';
	import TokenNewsTradingView from './TokenNewsTradingView.svelte';
	import TokenTechnicalView from './TokenTechnicalView.svelte';
	import TokenSymbolView from './TokenSymbolView.svelte';
	import { combinedTokenStore } from '$lib/common/derivedStores';

  interface Props {
    tokens?: TokenData[];
    title?: string;
    onTokenClick?: (token: TokenData) => void;
  }

  let { tokens = $combinedTokenStore, title = 'Token Portfolio', onTokenClick = (token) => {} }: Props = $props();

  let currentView = $state<'grid' | 'carousel' | 'thumbnail' | 'chart' | 'list' | 'table' | 'news' | 'analysis' | 'symbol'>('grid');
  let sortedTokens = $state([...tokens]);
  let sortBy = $state('name');

  // Handle sorting
  function handleSortChange(criteria: string) {
    sortBy = criteria;

    if (criteria === 'name') {
      sortedTokens = [...tokens].sort((a, b) => a.name.localeCompare(b.name));
    } else if (criteria === 'price') {
      sortedTokens = [...tokens].sort((a, b) => b?.price?.price ?? 0 - a?.price?.price ?? 0);
    } else if (criteria === 'value') {
      sortedTokens = [...tokens].sort((a, b) => (Number(b?.value ?? 0) ?? 0) - (Number(a?.value ?? 0) ?? 0));
    }
  }

  // Handle view changes
  function handleViewChange(view: 'grid' | 'carousel' | 'thumbnail' | 'chart' | 'list' | 'table' | 'news' | 'analysis' | 'symbol') {
    currentView = view;
  }

  // Handle print
  function handlePrint() {
    window.print(); // Simply prints the sceen. Needs to have the content in a print-friendly format
  }
</script>

<div class="w-full h-full mt-1">
  <!-- Header Section -->
  <div class="flex justify-between items-center px-2 py-1">
    <!-- Title -->
    <h2 class="text-lg font-bold text-gray-300">{title}</h2>

    <!-- ViewControls -->
    <ViewControls
      onSortChange={handleSortChange}
      onViewChange={handleViewChange}
      onPrint={handlePrint}
    />
  </div>

  <!-- Views -->
  <div class="relative rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 shadow-lg">
    {#if currentView === 'grid'}
      <TokenGridView tokens={sortedTokens} onTokenClick={onTokenClick} />
    <!-- {:else if currentView === 'carousel'}
      <TokenCarouselView tokens={sortedTokens} onTokenClick={onTokenClick} /> -->
    {:else if currentView === 'chart'}
      <TokenChartsView />
    {:else if currentView === 'news'}
      <TokenNewsTradingView />
    {:else if currentView === 'analysis'}
      <TokenTechnicalView symbol="COINBASE:ETHUSD"/>
    {:else if currentView === 'symbol'}
      <TokenSymbolView symbol="COINBASE:ETHUSD"/>
    <!-- {:else if currentView === 'thumbnail'}
      <TokenThumbnailView tokens={sortedTokens} onTokenClick={onTokenClick} /> -->
    {/if}
  </div>
</div>
