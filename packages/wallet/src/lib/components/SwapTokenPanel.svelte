<script lang="ts">
  import type { Writable } from 'svelte/store';
  import TokenDropdown from './TokenDropdown.svelte';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import TokenBalance from './TokenBalance.svelte';
  import type { SwapToken, SwapPriceData } from '$lib/common/interfaces';
  import { ethers } from 'ethers';
  import { BigNumber } from '$lib/common/bignumber';
  import { debounce } from 'lodash-es';
  import { debug_log } from '$lib/common';

  export let type: 'sell' | 'buy' = 'sell';
  export let tokens: SwapToken[];
  export let insufficientBalance: boolean = false;
  export let onTokenSelect: (token: SwapToken) => void;
  export let onAmountChange: (amount: string) => void;
  export let swapPriceDataStore: Writable<SwapPriceData>;

  let swapPriceData;
  $: swapPriceData = $swapPriceDataStore;

  let amountIn: bigint = 0n;
  let amountOut: bigint = 0n;
  let userInput = ''; // Holds temporary user input while typing
  let formattedAmount = '';
  let lastValidAmount = ''; // Track last valid amount

  $: if (swapPriceData.amountIn === 0n || swapPriceData.amountOut === 0n) {
    userInput = '';
    formattedAmount = '';
  }

  // Watch swapPriceData changes and update amounts accordingly
  $: { 
    if (swapPriceData.amountIn && swapPriceData.amountOut) {
      if (type === 'sell') {
        amountIn = BigNumber.toBigInt(swapPriceData.amountIn) || 0n;
        amountOut = BigNumber.toBigInt(swapPriceData.amountOut) || 0n;
        formattedAmount = formatAmount(amountIn, swapPriceData.tokenIn.decimals);
      } else {
        amountOut = BigNumber.toBigInt(swapPriceData.amountOut) || 0n;
        amountIn = BigNumber.toBigInt(swapPriceData.amountIn) || 0n;
        formattedAmount = formatAmount(amountOut, swapPriceData.tokenOut.decimals);
      }

      // Update last valid amount when store changes
      if (formattedAmount) {
        lastValidAmount = formattedAmount;
        userInput = ''; // Reset user input when store updates
      }
    } 
  }

  // Intelligent amount formatting
  function formatAmount(amount: bigint, decimals: number): string {
    if (amount === 0n) return '';
    
    const formattedValue = ethers.formatUnits(amount, decimals);
    
    // Remove trailing zeros after decimal point
    const [integerPart, decimalPart] = formattedValue.split('.');
    if (!decimalPart) return integerPart;
    
    const trimmedDecimal = decimalPart.replace(/0+$/, '');
    return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
  }

  // Debounced quote request
  let debouncedAmountChange = debounce((value: string) => {
    onAmountChange(value);
  }, 800);  // Increased delay to 800ms

  function handleAmountInput(event: any) {
    let value = event.target.value;

    // Sanitize input
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    
    // Limit to 6 decimal places
    if (parts[1] && parts[1].length > 6) {
      value = `${parts[0]}.${parts[1].slice(0, 6)}`;
    }

    userInput = value;
    
    // Only trigger debounce if there's a meaningful input
    if (value !== '' && value !== '.') {
      debouncedAmountChange(value);
    }
  }

  function handleBlur(event: FocusEvent) {
    const value = (event.target as HTMLInputElement).value;
    
    // Final sanitization and quote request on blur
    if (value !== '' && value !== '.') {
      onAmountChange(value);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // If backspace is pressed and input is empty, reset to last valid amount
    if (event.key === 'Backspace' && userInput === '') {
      userInput = lastValidAmount;
      onAmountChange(lastValidAmount);
    }
  }
</script>

<div class="border border-gray-300 shadow-md p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
  <div class="flex justify-between items-center">
    <input
      type="text"
      placeholder="0"
      value={userInput || formattedAmount}
      on:input={handleAmountInput}
      on:blur={handleBlur}
      on:keydown={handleKeyDown}
      class="
        bg-transparent 
        text-3xl 
        font-bold 
        w-1/2 
        mr-4 
        focus:outline-none 
        focus:border-b-2 
        focus:border-blue-500
        {insufficientBalance 
          ? 'text-red-500 dark:text-red-400' 
          : 'text-black dark:text-white'}
        "
    />
    <TokenDropdown {tokens} selectedToken={type === 'sell' ? swapPriceData.tokenIn : swapPriceData.tokenOut} onTokenSelect={onTokenSelect} />
  </div>
  <div class="flex justify-between items-center mt-2 text-sm">
    <SwapTokenPrice swapPriceDataStore={swapPriceDataStore} type={type} />
    <TokenBalance token={type === 'sell' ? swapPriceData.tokenIn : swapPriceData.tokenOut} />
  </div>
  {#if insufficientBalance}
  <div class="text-red-500 dark:text-red-400 text-sm mt-1">
    Insufficient balance for this swap
  </div>
  {/if}
</div>

