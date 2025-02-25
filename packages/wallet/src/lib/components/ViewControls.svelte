<script lang="ts">
	import ViewToggleMenu from "./ViewToggleMenu.svelte";

  export interface Props {
    onSortChange: (criteria: string) => void;
    onViewChange: (view: 'grid' | 'carousel' | 'thumbnail' | 'chart' | 'list' | 'table' | 'news' | 'analysis' | 'symbol') => void;
    onPrint?: () => void;
  }

  let { onSortChange, onViewChange, onPrint = () => {} }: Props = $props();

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Price', value: 'price' },
    { label: 'Value', value: 'value' }
  ];

  // Manage cycling views
  let currentView = $state<'grid' | 'carousel' | 'thumbnail' | 'chart' | 'list' | 'table' | 'news' | 'analysis' | 'symbol'>('grid');

  function onSelect(value: string) {
    currentView = value as 'grid' | 'carousel' | 'thumbnail' | 'chart' | 'list' | 'table' | 'news' | 'analysis' | 'symbol';
    onViewChange(currentView);
  }
</script>

<div class="flex items-center space-x-2 text-slate-700 bg-white/90 p-[2px] rounded-full">
  <!-- Sort Dropdown -->
  <div class="relative w-fit cursor-pointer">
    <select
      id="sortby"
      class="bg-gray-500 rounded-full px-2 py-1 text-sm cursor-pointer text-white"
      onchange={(e) => onSortChange((e.target as HTMLSelectElement).value)}
      title="Sort Tokens"
    >
      {#each sortOptions as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
    <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
      <!-- Down Chevron -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>

  <!-- Toggle View -->
  <ViewToggleMenu onSelect={onSelect} />
  <!-- May want to enable icon changes below or hover show -->
  <!-- <button
    class="hover:text-white"
    onclick={nextView}
    title="Switch View"
  >
    {#if currentView === 'grid'} -->
      <!-- Grid Icon -->
      <!-- <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    {:else if currentView === 'carousel'} -->
      <!-- Carousel Icon -->
      <!-- <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="12" x2="16" y2="16"></line>
      </svg>
    {:else if currentView === 'thumbnail'} -->
      <!-- Thumbnail Icon -->
      <!-- <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="12" y1="3" x2="12" y2="21" />
      </svg>
    {/if}
  </button> -->

  <!-- Print Button -->
  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button
    class="hover:text-white"
    onclick={onPrint}
    title="Print Portfolio"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
    </svg>
  </button>
</div>
