<script lang="ts">
  import ViewControls from './ViewControls.svelte';
  import TokenGrid from './TokenGrid.svelte';
  import TokenCarousel from './TokenCarousel.svelte';
  import type { TokenData } from '$lib/common/interfaces';

  interface Props {
    tokens: TokenData[];
    title?: string;
    onTokenClick: (token: TokenData) => void;
  }

  let { tokens = [], title = 'Token Portfolio', onTokenClick }: Props = $props();

  let isGridView = $state(false);
  let sortedTokens = $state([...tokens]);
  let sortBy = 'name';

  // Sorting logic
  function handleSortChange(criteria: string) {
    sortBy = criteria;
    if (criteria === 'name') {
      sortedTokens = [...tokens].sort((a, b) => a.name.localeCompare(b.name));
    } else if (criteria === 'price') {
      sortedTokens = [...tokens].sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (criteria === 'value') {
      sortedTokens = [...tokens].sort((a, b) => (Number(b.value) ?? 0) - (Number(a.value) ?? 0));
    }
  }

  function handleToggleView() {
    isGridView = !isGridView;
  }

  function handlePrint() {
    window.print();
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
      onToggleView={handleToggleView}
      onPrint={handlePrint}
      isGridView={isGridView}
    />
  </div>

  <!-- Views -->
  <div class="relative h-[500px] w-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 shadow-lg">
    {#if isGridView}
      <TokenGrid tokens={sortedTokens} onTokenClick={onTokenClick} />
    {:else}
      <TokenCarousel tokens={sortedTokens} onTokenClick={onTokenClick} />
    {/if}
  </div>
</div>
