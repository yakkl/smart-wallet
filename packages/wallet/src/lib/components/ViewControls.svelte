<script lang="ts">
  export interface Props {
    onSortChange: (criteria: string) => void;
    onToggleView: () => void;
    onPrint?: () => void;
    isGridView: boolean;
  }

  let { onSortChange, onToggleView, onPrint = () => {}, isGridView }: Props = $props();

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Price', value: 'price' },
    { label: 'Value', value: 'value' }
  ];
</script>

<div class="flex items-center space-x-2 text-slate-700 bg-white/90 p-[2px] rounded-full">
  <div class="relative w-fit cursor-pointer">
    <!-- Sort Dropdown -->
    <select
      class="bg-gray-500 rounded-full px-2 py-1 text-sm cursor-pointer"
      onchange={(e) => onSortChange((e.target as HTMLSelectElement).value)}
      title="Sort Tokens"
    >
      {#each sortOptions as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>

    <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none cursor-pointer">
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
  <button
    class="hover:text-white"
    onclick={onToggleView}
    title={isGridView ? 'Switch to Carousel View' : 'Switch to Grid View'}
  >
    {#if isGridView}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    {/if}
  </button>

  <!-- Print Button -->
  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button
    class="hover:text-white"
    onclick={onPrint}
    title="Print Portfolio"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
    </svg>
  </button>
</div>
