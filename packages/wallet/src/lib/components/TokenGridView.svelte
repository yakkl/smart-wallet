<script lang="ts">
  import TokenGridItem from './TokenGridItem.svelte';
  import type { TokenData } from '$lib/common/interfaces';

  interface Props {
    tokens: TokenData[];
    onTokenClick: (token: TokenData) => void;
  }

  let { tokens = [], onTokenClick }: Props = $props();

  // Can get creative with the grid layout here if we desire
  // function getClassName(index: number): string {
  //   if (index === 0) {
  //     return 'w-[144px] h-[68px] border-r border-gray-400';
  //   } else if (index === tokens.length - 1) {
  //     return 'w-[144px] h-[68px]';
  //   } else {
  //     return 'w-[169px] h-[68px] mx-[25px] border-r border-gray-400';
  //   }
  // }

</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-2 h-full overflow-y-scroll">
  {#each tokens as token, index}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="cursor-pointer hover:shadow-lg transition-all duration-200 rounded-md p-2 border border-gray-200 dark:border-gray-700"
    >
      <TokenGridItem token={token} onClick={onTokenClick} className={'bg-white'}/>
    </div>
  {/each}
</div>
