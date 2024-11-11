<script lang="ts">
  import { get, type Writable } from 'svelte/store';
  import type { SwapPriceData } from '$lib/common/interfaces';
	import { BigNumber } from '$lib/common/bignumber';
	import { ethers } from 'ethers';
	import { formatPrice } from '$lib/utilities/utilities';

  export let swapPriceDataStore: Writable<SwapPriceData>;

  let amountIn: bigint = 0n;
  let amountOut: bigint = 0n;
  let exchangeRate: number = 0;

  // Declare reactive variables
  $: amountIn = BigNumber.toBigInt(swapPriceData.amountIn) || 0n;
  $: amountOut = BigNumber.toBigInt(swapPriceData.amountOut) || 0n;
  $: swapPriceData = $swapPriceDataStore;
  $: tokenOutPriceInUSD = swapPriceData.tokenOutPriceInUSD || '~N/A~';
  $: gasEstimateInUSD = swapPriceData.gasEstimateInUSD || '~N/A~';
  $: feeBasisPointsToPercent = `${swapPriceData.feeBasisPoints / 100}%`;

  $: {
    if (swapPriceData && swapPriceData.amountIn && swapPriceData.amountOut) {
      const tokenIn = swapPriceData.tokenIn;
      const tokenOut = swapPriceData.tokenOut;
      
      // More precise exchange rate calculation
      const amountInFormatted = parseFloat(
        ethers.formatUnits(BigNumber.toBigInt(swapPriceData.amountIn) || 0n, tokenIn.decimals)
      );
      const amountOutFormatted = parseFloat(
        ethers.formatUnits(BigNumber.toBigInt(swapPriceData.amountOut) || 0n, tokenOut.decimals)
      );
      
      exchangeRate = amountOutFormatted / amountInFormatted;
    }
  }

  // Fallback fee calculation
  $: feeAmountInUSD = swapPriceData.feeAmountInUSD 
    || (swapPriceData.feeAmount && swapPriceData.marketPriceOut 
      ? formatPrice(
          parseFloat(
            ethers.formatUnits(BigNumber.toBigInt(swapPriceData.feeAmount) || 0n, swapPriceData.tokenOut.decimals)
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
        class="w-4 h-4 text-gray-300"
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
