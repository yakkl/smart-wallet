<script lang="ts">
	import { BigNumber } from '$lib/common/bignumber';
	import { formatDate } from '$lib/common/datetime';
	import { debug_log } from '$lib/common/debug';
  import type { SwapPriceData } from '$lib/common/interfaces';
  import { formatPrice } from '$lib/utilities';
	import { ethers } from 'ethers';
  import type { Writable } from 'svelte/store';

  export let swapPriceDataStore: Writable<SwapPriceData>;
  export let type: 'sell' | 'buy' = 'sell';
  export let showLastUpdated: boolean = false;
  export let className: string = '';

  $: swapPriceData = $swapPriceDataStore;

  // Display the price based on the type (sell/buy)
  let price = 0;
  $: {
    if (swapPriceData) {
      const tokenIn = swapPriceData.tokenIn;
      const tokenOut = swapPriceData.tokenOut;
      const amountIn = BigNumber.toBigInt(swapPriceData.amountIn) || 0n;
      const amountOut = BigNumber.toBigInt(swapPriceData.amountOut) || 0n;
      const marketPriceIn = swapPriceData.marketPriceIn;
      const marketPriceOut = swapPriceData.marketPriceOut;

      if (type === 'sell' && amountIn && marketPriceIn) {
        price = parseFloat(ethers.formatUnits(amountIn, tokenIn.decimals)) * marketPriceIn;
      } else if (type === 'buy' && amountOut && marketPriceOut) {
        price = parseFloat(ethers.formatUnits(amountOut, tokenOut.decimals)) * marketPriceOut;
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
    {#if showLastUpdated && (swapPriceData && swapPriceData.lastUpdated)}
      <span>Last updated: {formatDate(swapPriceData.lastUpdated)}</span>
    {/if}
  </div>
</div>
