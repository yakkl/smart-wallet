<script lang="ts">
  import type { TokenData } from '$lib/common/interfaces';
	import * as HoverCard from './ui/hover-card';

  export interface Props {
    token: TokenData;
    className?: string;
    onClick?: (token: TokenData) => void;
  }

  let { token, className = 'w-[169px] h-[68px] border-r border-gray-400', onClick = () => {} }: Props = $props();

  // Determine percentChange color
  const percentChangeColor = token.percentChange >= 0 ? 'text-green-500' : 'text-red-500';
</script>

<HoverCard.Root openDelay={300}>
  <HoverCard.Trigger>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="flex flex-col justify-start items-start cursor-pointer relative {className}"
      onclick={() => onClick(token)}>
      <div class="flex items-center gap-2 w-[120px] h-[24px]">
        <img src={token.logoURI} alt={token.symbol} class="w-6 h-6" />
        <span class="text-slate-900 font-semibold leading-6">{token.symbol}</span>
      </div>
      <div class="w-[120px] h-[28px] text-xl text-slate-900 font-bold leading-7">
        ${token.currentPrice.toLocaleString()}
      </div>
      <div class={`flex items-center gap-1 ${percentChangeColor}`}>
        {#if token.percentChange > 0}
          ▲
        {:else if token.percentChange === 0}
          --
        {:else}
          ▼
        {/if}
        {token.percentChange}%
      </div>
    </div>
  </HoverCard.Trigger>
  <HoverCard.Content class="w-80 bg-white cursor-pointer p-4" align="end">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
    class="flex justify-between space-x-4"
    onclick={() => onClick(token)}>
      <div class="space-y-2 text-slate-900">
        <p class="font-bold mb-1 flex items-center gap-2">
          <img src={token.logoURI} alt={token.symbol} class="w-8 h-8" />
          <span class="font-semibold leading-6">{token.name} - {token.symbol}</span>
        </p>
        <p>Price: ${token.currentPrice.toLocaleString()}</p>
        <p>Value: ${token.value?.toLocaleString() ?? 'N/A'}</p>
        <p>Quantity: {token.quantity?.toLocaleString() ?? 'N/A'}</p>
        <p>Change: <span class={percentChangeColor}>{token.percentChange}%</span></p>
      </div>
    </div>
  </HoverCard.Content>
</HoverCard.Root>
