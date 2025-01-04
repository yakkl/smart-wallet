<script lang="ts">
  import type { TokenData } from '$lib/common/interfaces';
	import { getTokenChange } from '$lib/utilities';
	import * as HoverCard from './ui/hover-card';
  import { formatPrice, formatQuantity } from '$lib/utilities';

  export interface Props {
    token: TokenData;
    className?: string;
    onClick?: (token: TokenData) => void;
  }

  let { token, className = 'w-[169px] h-[68px] border-r border-gray-400', onClick = () => {} }: Props = $props();

  let price = $state(0);
  // let priceFormatted = $state('');
  let value = $state(0);
  let valueFormatted = $state('');
  let balance = $state(token?.balance);

  // Determine the 24h percentChange color
  const percentChange: number | null = getTokenChange(token.change, '24h'); // This is all we are getting here
  const percentChangeColor = percentChange === null ? 'text-slate-900' : percentChange >= 0 ? 'text-green-500' : 'text-red-500';

  $effect(() => {
    balance = token?.balance;
    price = token?.price?.price ?? 0;
    // priceFormatted = formatPrice(price);
    value = balance ? Number(balance) * price : 0;
    valueFormatted = formatPrice(value);
  });
</script>

<HoverCard.Root openDelay={300}>
  <HoverCard.Trigger>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="flex flex-col bg-white justify-start items-start cursor-pointer relative {className}"
      onclick={() => onClick(token)}>
      <div class="flex items-center gap-2 w-[120px] h-[24px]">
        <img src={token.logoURI} alt={token.symbol} class="w-6 h-6" />
        <span class="text-slate-900 font-semibold leading-6">{token.symbol}</span>
      </div>
      <div class="w-[120px] h-[28px] text-xl text-slate-900 font-bold leading-7">
        ${price}
      </div>
      <div class={`flex items-center gap-1 ${percentChangeColor}`}>
        {#if percentChange > 0}
          ▲
        {:else if percentChange === null || percentChange === 0}
          --
        {:else}
          ▼
        {/if}
        {percentChange}%
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
        <p>Price: ${price}</p>
        <p>Value: {valueFormatted}</p>
        <p>Quantity: {balance}</p>
        <p>Change: <span class={percentChangeColor}>{percentChange ? percentChange : '--'}%</span></p>
      </div>
    </div>
  </HoverCard.Content>
</HoverCard.Root>
