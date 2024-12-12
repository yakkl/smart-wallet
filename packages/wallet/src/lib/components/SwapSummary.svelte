<script lang="ts">
  import { type Writable } from 'svelte/store';
  import type { SwapPriceData } from '$lib/common/interfaces';
  import { ethers as ethersv6 } from 'ethers-v6';
  import {
    calculateFeeAmount,
    calculateFeeBasisPointsPercent,
    formatFeeToUSD
  } from '$lib/utilities/utilities';
  import { toBigInt } from '$lib/common/math';
  import { YAKKL_FEE_BASIS_POINTS_DIVISOR } from '$lib/common';

  interface Props {
    swapPriceDataStore: Writable<SwapPriceData>;
    disabled?: boolean; // This assumes for wrapping and unwrapping of ETH WETH
  }

  let { swapPriceDataStore, disabled = false }: Props = $props();

  let exchangeRate = $state(0);
  let feeBasisPointsToPercent = $state('0.0000%');

  // Declare reactive variables
  let swapPriceData = $derived($swapPriceDataStore);
  let tokenOutPriceInUSD = $derived(swapPriceData.tokenOutPriceInUSD || '--');
  let gasEstimateInUSD = $derived(swapPriceData.gasEstimateInUSD || '--');

  // Replace first run with $effect
  $effect(() => {
    feeBasisPointsToPercent = swapPriceData
      ? calculateFeeBasisPointsPercent(swapPriceData.feeBasisPoints)
      : '0.0000%';
  });

  // Replace second run with $effect
  $effect(() => {
    if (swapPriceData &&
        toBigInt(swapPriceData.amountIn) > 0n &&
        toBigInt(swapPriceData.amountOut) > 0n) {
      const tokenIn = swapPriceData.tokenIn;
      const tokenOut = swapPriceData.tokenOut;

      // More precise exchange rate calculation
      const amountInFormatted = parseFloat(
        ethersv6.formatUnits(toBigInt(swapPriceData.amountIn) || 0n, tokenIn.decimals)
      );
      const amountOutFormatted = parseFloat(
        ethersv6.formatUnits(toBigInt(swapPriceData.amountOut) || 0n, tokenOut.decimals)
      );

      if (amountInFormatted > 0 && amountOutFormatted > 0) {
        exchangeRate = amountOutFormatted / amountInFormatted;
      } else {
        exchangeRate = 0;
      }
    } else {
      exchangeRate = 0;
    }
  });

  let feeAmountInUSD = $derived((() => {
    if (
      swapPriceData &&
      toBigInt(swapPriceData.amountIn) > 0n &&
      swapPriceData.marketPriceIn > 0 &&
      swapPriceData.tokenIn &&
      swapPriceData.tokenIn.decimals &&
      swapPriceData.feeBasisPoints &&
      disabled === false
    ) {
      // Convert basis points to precise decimal
      const feeDecimal = swapPriceData.feeBasisPoints / YAKKL_FEE_BASIS_POINTS_DIVISOR;

      // Calculate fee amount in token units without rounding
      const feeAmount = calculateFeeAmount(
        toBigInt(swapPriceData.amountIn),
        swapPriceData.feeBasisPoints
      );
      return formatFeeToUSD(
        feeAmount,
        swapPriceData.tokenIn.decimals,
        swapPriceData.marketPriceIn
      );
    } else {
      // Fallback value until all data is available or valid
      return disabled ? '' : 'Calculating...';
    }
  })());
</script>

<div class="space-y-2 text-sm text-gray-500">
  <!-- Exchange Rate Display -->
  {#if !disabled}
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
  {/if}

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
  {#if !disabled}
  <div class="flex justify-between w-full">
    <span class="text-left truncate">
      Fee ({feeBasisPointsToPercent}): ≈ {feeAmountInUSD}
    </span>
  </div>
  {/if}
</div>
