<script lang="ts">
  import type { TokenData } from '$lib/common/interfaces';
	import * as HoverCard from './ui/hover-card';

  interface Props {
    token: TokenData;
    isLarge?: boolean;
    className?: string;
    onClick?: (token: TokenData) => void;
  }

  let { token, isLarge = false, className = 'bg-white', onClick = () => {} }: Props = $props();

  // Determine percentChange color
  const percentChangeColor = token.percentChange >= 0 ? 'text-green-500' : 'text-red-500';
</script>

<HoverCard.Root openDelay={300}>
  <HoverCard.Trigger>
<div
  class="flex flex-col items-center justify-center p-2 w-full h-full rounded-lg border shadow-md {className}"
>
<!--   class:bg-purple-100={isLarge}
 -->
<!-- w-16 h-16-->
  <img src={token.logoURI} alt="{token.symbol}" class={isLarge ? 'w-16 h-16' : 'w-12 h-12'} />
  <h3 class="text-lg font-bold mt-2">{token.symbol}</h3>
  <p class="text-gray-600 mt-1">${token.currentPrice}</p>
  {#if isLarge}
    <p class="text-gray-500 mt-1">Quantity: {token.balance}</p>
    <p class="text-gray-500 mt-1">Value: ${token.value}</p>
  {/if}
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
