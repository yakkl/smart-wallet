<script lang="ts">
  import { formatDate } from '$lib/common/datetime';
  import type { SwapPriceData } from '$lib/common/interfaces';
  import { toBigInt } from '$lib/common/math';
  import { formatPrice, formatQuantity } from '$lib/utilities';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { onMount } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { isUsdModeStore } from '$lib/common/stores/uiStateStore';

  let isUsdMode = $state(isUsdModeStore);

  interface Props {
    swapPriceDataStore: Writable<SwapPriceData>;
    type?: 'sell' | 'buy';
    showLastUpdated?: boolean;
    className?: string;
  }

  let {
    swapPriceDataStore,
    type = 'sell',
    showLastUpdated = false,
    className = ''
  }: Props = $props();

  // Display the price based on the type (sell/buy)
  let price = $state(0);
  let amount = $state(0n);
  let decimals = $state(0);

  onMount(async () => {
    swapPriceDataUpdated();
  });

  function swapPriceDataUpdated() {
    if (swapPriceData) {
      const tokenIn = swapPriceData.tokenIn;
      const tokenOut = swapPriceData.tokenOut;
      const amountIn = toBigInt(swapPriceData.amountIn);
      const amountOut = toBigInt(swapPriceData.amountOut);
      const marketPriceIn = swapPriceData.marketPriceIn;
      const marketPriceOut = swapPriceData.marketPriceOut;

      price = 0;

      if (type === 'sell') {
        decimals = tokenIn?.decimals || 0;
        amount = amountIn;
        if (amountIn > 0n && marketPriceIn > 0) {
          price = parseFloat(ethersv6.formatUnits(amountIn, tokenIn.decimals)) * marketPriceIn;
        } else {
          price = Math.abs(marketPriceIn);
        }
      } else if (type === 'buy') {
        decimals = tokenOut?.decimals || 0;
        amount = amountOut;
        if (amountOut > 0n && marketPriceOut > 0) {
          price = parseFloat(ethersv6.formatUnits(amountOut, tokenOut.decimals)) * marketPriceOut;
        } else {
          price = Math.abs(marketPriceOut);
        }
      }
    }
  }

  function getSymbolPair() {
    const inSymbol = swapPriceData.tokenIn?.symbol || '';
    const outSymbol = swapPriceData.tokenOut?.symbol || '';
    return inSymbol && outSymbol ? `${inSymbol}/${outSymbol}` : '';
  }

  let swapPriceData = $derived($swapPriceDataStore);

  // Replace run with $effect
  $effect(() => {
    if (swapPriceData) {
      swapPriceDataUpdated();
    }
  });
</script>

<div class="flex flex-col w-full gap-1 {className}">
  <div class="flex justify-between items-center w-full">
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">{getSymbolPair()}</span>
      <span class="text-sm font-semibold">{isUsdMode ? `${formatPrice(price)}` : `${formatQuantity(amount, decimals)}`}</span>
    </div>
  </div>

  <div class="flex justify-between items-center w-full text-xs text-gray-500">
    {#if price > 0 && showLastUpdated && (swapPriceData && swapPriceData.lastUpdated)}
      <span>Last updated: {formatDate(swapPriceData.lastUpdated)}</span>
    {/if}
  </div>
</div>
