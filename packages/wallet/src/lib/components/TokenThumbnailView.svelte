<script lang="ts">
  import TokenThumbnailItem from './TokenThumbnailItem.svelte';
  import type { TokenData } from '$lib/common/interfaces';

  export interface Props {
    tokens: TokenData[];
    onTokenClick?: (token: TokenData) => void;
  }

  let { tokens = [], onTokenClick = () => {} }: Props = $props();

  // State for controlling scroll position
  let scrollContainer: HTMLDivElement | null = null;

  // Scroll Navigation
  const scrollLeft = () => {
    if (scrollContainer) scrollContainer.scrollBy({ left: -180, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (scrollContainer) scrollContainer.scrollBy({ left: 180, behavior: 'smooth' });
  };

  function getClassName(index: number): string {
    if (index === 0) {
      return 'w-[144px] h-[68px] border-r border-gray-400';
    } else if (index === tokens.length - 1) {
      return 'w-[144px] h-[68px]';
    } else {
      return 'w-[169px] h-[68px] mx-[25px] border-r border-gray-400';
    }
  }

</script>

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .fade-gradient {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 25px;
    pointer-events: none;
    background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
  }

  .fade-gradient-left {
    left: 0;
  }

  .fade-gradient-right {
    right: 0;
    background: linear-gradient(to left, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
  }
</style>

<!-- Token Thumbnail View -->
<div class="relative flex items-center w-[90%] mx-4 h-[72px] overflow-hidden">
  <!-- Left Fade and Arrow -->
  <div class="fade-gradient fade-gradient-left"></div>
  <button
    class="absolute left-0 bg-gray-600 hover:bg-gray-800 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center"
    aria-label="Previous"
    onclick={scrollLeft}
  >
    &#8592;
  </button>

  <!-- Thumbnail Items -->
  <div
    class="flex items-stretch overflow-x-auto no-scrollbar mx-10"
    bind:this={scrollContainer}
  >
    {#each tokens as token, index}
      <TokenThumbnailItem token={token} onClick={onTokenClick} className={getClassName(index)}/>
    {/each}
  </div>

  <!-- Right Fade and Arrow -->
  <div class="fade-gradient fade-gradient-right"></div>
  <button
    class="absolute right-0 bg-gray-600 hover:bg-gray-800 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center"
    aria-label="Next"
    onclick={scrollRight}
  >
    &#8594;
  </button>
</div>
