<script lang="ts">
	import { formatDate } from '$lib/common/datetime';
	import { debug_log } from '$lib/common/debug';
  import type { SwapPriceData } from '$lib/common/interfaces';
	import { toBigInt } from '$lib/common/math';
  import { formatPrice } from '$lib/utilities';
	import { ethers } from 'ethers';
	import { onMount } from 'svelte';
  import type { Writable } from 'svelte/store';

  export let swapPriceDataStore: Writable<SwapPriceData>;
  export let type: 'sell' | 'buy' = 'sell';
  export let showLastUpdated: boolean = false;
  export let className: string = '';

  // Display the price based on the type (sell/buy)
  let price = 0;
  
  $: swapPriceData = $swapPriceDataStore;

  $: {
    if (swapPriceData) {
      swapPriceDataUpdated();
    }
  }
  
  onMount(async () => {
    swapPriceDataUpdated();
  });

  function swapPriceDataUpdated() {
    if (swapPriceData) {
      const tokenIn = swapPriceData.tokenIn;
      const tokenOut = swapPriceData.tokenOut;
      const amountIn = toBigInt(swapPriceData.amountIn) || 0n;
      const amountOut = toBigInt(swapPriceData.amountOut) || 0n;
      const marketPriceIn = swapPriceData.marketPriceIn;
      const marketPriceOut = swapPriceData.marketPriceOut;

      price = 0;

      if (type === 'sell') {
        if (amountIn > 0n && marketPriceIn > 0) {
          price = parseFloat(ethers.formatUnits(amountIn, tokenIn.decimals)) * marketPriceIn;
        } else {
          price = 0;
        }
      } else if (type === 'buy') {
        if (amountOut > 0n && marketPriceOut > 0) {
          price = parseFloat(ethers.formatUnits(amountOut, tokenOut.decimals)) * marketPriceOut;
        } else {
          price = 0;
        }
      }
    }
  }

  function getSymbolPair() {
    const inSymbol = swapPriceData.tokenIn?.symbol || '';
    const outSymbol = swapPriceData.tokenOut?.symbol || '';
    return inSymbol && outSymbol ? `${inSymbol}/${outSymbol}` : '';
  }
</script>

<div class="flex flex-col w-full gap-1 {className}">
  <div class="flex justify-between items-center w-full">
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-600">{getSymbolPair()}</span>
      <span class="text-sm font-semibold">{formatPrice(price)}</span>
    </div>
  </div>

  <div class="flex justify-between items-center w-full text-xs text-gray-500">
    {#if price > 0 && showLastUpdated && (swapPriceData && swapPriceData.lastUpdated)}
      <span>Last updated: {formatDate(swapPriceData.lastUpdated)}</span>
    {/if}
  </div>
</div>
