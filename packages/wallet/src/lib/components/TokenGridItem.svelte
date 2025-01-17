<script lang="ts">
  import type { TokenData } from '$lib/common/interfaces';
	import { formatPrice, getTokenChange } from '$lib/utilities/utilities';
	import ProtectedValue from './ProtectedValue.svelte';
	import * as HoverCard from './ui/hover-card';

  interface Props {
    token: TokenData;
    isLarge?: boolean;
    className?: string;
    onClick?: (token: TokenData) => void;
  }

  let { token, isLarge = false, className = 'bg-white', onClick = () => {} }: Props = $props();

  // Determine the 24h percentChange color
  const percentChange: number | null = getTokenChange(token.change, '24h'); // This is all we are getting here
  const percentChangeColor = percentChange === null ? 'text-slate-900' : percentChange >= 0 ? 'text-green-500' : 'text-red-500';

  let balance = $state(token?.balance);
  let price = $state(0);
  let priceFormatted = $state('');
  let value = $state(0);
  let valueFormatted = $state('');

  $effect(() => {
    balance = token?.balance;
    price = token?.price?.price ?? 0;
    priceFormatted = formatPrice(price);
    value = balance ? Number(balance) * price : 0;
    valueFormatted = formatPrice(value);
  });
</script>

<HoverCard.Root openDelay={300}>
  <HoverCard.Trigger>
<div
  class="flex flex-col items-center justify-center p-1 w-full h-full rounded-lg border shadow-md {className}">
  <img src={token.logoURI} alt="{token.symbol}" class="{isLarge ? 'w-14 h-14' : 'w-8 h-8'} rounded-full" />
  <h3 class="font-bold mt-2 text-md">{token.symbol}</h3>
  <p class="text-gray-500 mt-1 text-sm">Value: <span><ProtectedValue value={valueFormatted} placeholder="*******" /></span></p>
  {#if isLarge}
    <p class="text-gray-500 mt-1 text-sm">Price: $<span><ProtectedValue value={price.toString()} placeholder="*******" /></span></p>
    <p class="text-gray-600 mt-1 text-xs">Qty: <span><ProtectedValue value={balance.toString()} placeholder="*******" /></span></p>
  {/if}
</div>
  </HoverCard.Trigger>
  <HoverCard.Content class="w-80 bg-white cursor-pointer p-4" align="end">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
    class="flex justify-between space-x-4"
    onclick={() => onClick(token)}>
      <div class="space-y-2 text-slate-900 text-md">
        <p class="font-bold mb-1 flex items-center gap-2">
          <img src={token.logoURI} alt={token.symbol} class="w-8 h-8" />
          <span class="font-semibold leading-6">{token.name} - {token.symbol}</span>
        </p>
        <p>Price: $<span><ProtectedValue value={price.toString()} placeholder="*******" /></span></p>
        <p>Value: <span><ProtectedValue value={valueFormatted} placeholder="*******" /></span></p>
        <p>Quantity: <span><ProtectedValue value={balance.toString()} placeholder="*******" /></span></p>
        <p>Change: <span class={percentChangeColor}>{percentChange ? percentChange : '--'}%</span></p>
      </div>
    </div>
  </HoverCard.Content>
</HoverCard.Root>
