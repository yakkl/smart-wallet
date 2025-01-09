<script lang="ts">
  import TokenGridItem from './TokenGridItem.svelte';
  import type { TokenData } from '$lib/common/interfaces';

  interface Props {
    tokens: TokenData[];
    onTokenClick: (token: TokenData) => void;
  }

  let { tokens = [], onTokenClick }: Props = $props();
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-2 h-full overflow-y-scroll">
  {#each tokens as token }
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore event_directive_deprecated -->
    <div
      class="cursor-pointer hover:shadow-lg transition-all duration-200 rounded-md p-2 border border-gray-200 dark:border-gray-700"
      on:click={() => onTokenClick(token)}
    >
      <TokenGridItem token={token} />
    </div>
  {/each}
</div>
