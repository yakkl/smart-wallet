<script lang="ts">
  import TokenGridItem from './TokenGridItem.svelte';
  import type { TokenData } from '$lib/common/interfaces';

  interface Props {
    tokens: TokenData[];
    onTokenClick: (token: TokenData) => void;
  }

  let { tokens = [], onTokenClick }: Props = $props();
  let activeIndex = $state(0);

  function nextToken() {
    if (activeIndex < tokens.length - 1) activeIndex += 1;
  }

  function prevToken() {
    if (activeIndex > 0) activeIndex -= 1;
  }
</script>

<div class="relative w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg">
  <!-- Previous Button top-1/2 transform -translate-y-1/2-->
  <button
    class="absolute w-10 h-10 left-2 bg-gray-600/80 text-white rounded-full p-3 hover:bg-gray-800"
    onclick={prevToken}
  >
    &#x25C0;
  </button>

  <!-- Active Token -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="w-full h-full flex items-center justify-center p-4"
  >
    <div class="border rounded-lg shadow-lg bg-white p-6 text-center w-[80%] h-[90%]">
      <TokenGridItem token={tokens[activeIndex]} onClick={onTokenClick} isLarge={true} className={'bg-purple-500/50'}/>
    </div>
  </div>

  <!-- Next Button top-1/2 transform -translate-y-1/2-->
  <button
    class="absolute w-10 h-10 right-2 bg-gray-600/80 text-white rounded-full p-3 hover:bg-gray-800"
    onclick={nextToken}
  >
    &#x25B6;
  </button>
</div>
