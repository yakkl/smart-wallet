<script lang="ts">
  import TokenGridItem from './TokenGridItem.svelte';
  import type { TokenData } from '$lib/common/interfaces';

  // Props
  export let tokens: TokenData[] = [];
  export let onTokenClick: (token: TokenData) => void;
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-2 h-full overflow-y-scroll">
  {#each tokens as token}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="cursor-pointer hover:shadow-lg transition-all duration-200 rounded-md p-2 border border-gray-200 dark:border-gray-700"
      on:click={() => onTokenClick(token)}
      role="button"
      tabindex="0"
      aria-label="Token item"
    >
      <TokenGridItem {token} />
    </div>
  {/each}
</div>
