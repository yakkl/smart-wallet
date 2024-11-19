<script lang="ts">
  import { get, type Writable } from 'svelte/store';
  import type { SwapPriceData } from '$lib/common/interfaces';
	import { ethers } from 'ethers';
	import { formatPrice } from '$lib/utilities/utilities';
	import { toBigInt } from '$lib/common/math';

  export let swapPriceDataStore: Writable<SwapPriceData>;

  let exchangeRate: number = 0;

  // Declare reactive variables
  $: swapPriceData = $swapPriceDataStore;
  $: tokenOutPriceInUSD = swapPriceData.tokenOutPriceInUSD || '~N/A~';
  $: gasEstimateInUSD = swapPriceData.gasEstimateInUSD || '~N/A~';
  $: feeBasisPointsToPercent = `${swapPriceData.feeBasisPoints / 1000}%`; // 250, 500, 875, 1000 (.25%, .5%, .875%, 1%)

  $: {
    if (swapPriceData && toBigInt(swapPriceData.amountIn) > 0n && toBigInt(swapPriceData.amountOut) > 0n) {
      const tokenIn = swapPriceData.tokenIn;
      const tokenOut = swapPriceData.tokenOut;
      
      // More precise exchange rate calculation
      const amountInFormatted = parseFloat(
        ethers.formatUnits(toBigInt(swapPriceData.amountIn) || 0n, tokenIn.decimals)
      );
      const amountOutFormatted = parseFloat(
        ethers.formatUnits(toBigInt(swapPriceData.amountOut) || 0n, tokenOut.decimals)
      );
      if (amountInFormatted > 0 && amountOutFormatted > 0) {
        exchangeRate = amountOutFormatted / amountInFormatted;
      } else {
        exchangeRate = 0;
      }
    } else {
      exchangeRate = 0;
    }
  }

  // Fallback fee calculation
  $: feeAmountInUSD = swapPriceData.feeAmountInUSD 
    || (swapPriceData.feeAmount && swapPriceData.marketPriceOut 
      ? formatPrice(
          parseFloat(
            ethers.formatUnits(toBigInt(swapPriceData.feeAmount) || 0n, swapPriceData.tokenOut.decimals)
          ) * swapPriceData.marketPriceOut
        )
      : '~N/A~');

</script>

<div class="space-y-2 text-sm text-gray-500">
  <!-- Exchange Rate Display -->
  <div class="flex justify-between w-full">
    <span class="text-left truncate">
      {#if exchangeRate && exchangeRate > 0}
        Exchange Rate: 1 {swapPriceData.tokenOut.symbol} ≈ {(1/exchangeRate).toFixed(6)} {swapPriceData.tokenIn.symbol}
      {:else}
        Exchange Rate: ~N/A~
      {/if}
    </span>
  </div>

  <!-- Token Out Price in USD -->
  <div class="flex justify-between w-full">
    <span class="text-left truncate">
      Token Price (USD): {tokenOutPriceInUSD}
    </span>
  </div>

  <!-- Gas Fee Estimate -->
  <div class="flex justify-between items-center w-full">
    <div class="flex items-center space-x-2">
      <img 
        src="/images/gas.svg" 
        alt="Gas Estimate" 
        class="w-3 h-3"
      />
      <span>Gas Fee ≈ {gasEstimateInUSD}</span>
    </div>
  </div>

  <!-- Fee Estimate -->
  <div class="flex justify-between w-full">
    <span class="text-left truncate">
      Fee ({feeBasisPointsToPercent}): ≈ {feeAmountInUSD}
    </span>
  </div>
</div>
