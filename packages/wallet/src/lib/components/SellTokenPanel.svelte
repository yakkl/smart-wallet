<script lang="ts">
  import type { Writable } from 'svelte/store';
  import TokenDropdown from './TokenDropdown.svelte';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import type { SwapToken, SwapPriceData } from '$lib/common/interfaces';
  import { ethers } from 'ethers';
  import { debounce } from 'lodash-es';
  import { toBigInt } from '$lib/common';

  // Component props
  export let tokens: SwapToken[] = [];
  export let disabled = false;
  export let insufficientBalance = false;
  export let balance = '0';
  export let resetValues = false;
  export let swapPriceDataStore: Writable<SwapPriceData>;
  export let onTokenSelect: (token: SwapToken) => void;
  export let onAmountChange: (amount: string) => void;

  // Reactive store value
  let swapPriceData: SwapPriceData;
  $: { 
    swapPriceData = $swapPriceDataStore;
  }

  // Input state management
  let userInput = ''; // Temporary user input
  let formattedAmount = ''; // Formatted display amount

  // Reset handling
  $: {
    if (resetValues) {
      userInput = '';
      formattedAmount = '';
      resetValues = false;
    }
  }

  // Amount formatting from store updates
  $: {
    if (!userInput && toBigInt(swapPriceData.amountIn) > 0n) {
      formattedAmount = formatAmount(
        toBigInt(swapPriceData.amountIn),
        swapPriceData.tokenIn.decimals
      );
    } else {
      formattedAmount = userInput;
    }
  }

  // Amount formatting utility
  function formatAmount(amount: bigint, decimals: number): string {
    if (amount === 0n) return '';
    
    const formattedValue = ethers.formatUnits(amount, decimals);
    
    // Remove trailing zeros after decimal point
    const [integerPart, decimalPart] = formattedValue.split('.');
    if (!decimalPart) return integerPart;
    
    const trimmedDecimal = decimalPart.replace(/0+$/, '');
    return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
  }

  // Debounced amount change handler
  const debouncedAmountChange = debounce((value: string) => {
    onAmountChange(value);
  }, 300);

  // Input handling
  function handleAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
  
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
    
    // Clear if empty
    if (value === '' || value === '.') {
      userInput = '';
      formattedAmount = '';
      onAmountChange('');
      return;
    }
    
    userInput = value;
    formattedAmount = value; 

    // Trigger change only for meaningful input
    debouncedAmountChange(value);
  }

  // Blur handler
  function handleBlur() {
    // Only clear if the input is actually empty
    if (!userInput || userInput === '' || userInput === '.') {
      userInput = '';
      // Only clear formattedAmount if there's no valid stored amount
      if (!formattedAmount || formattedAmount === '0') {
        formattedAmount = '';
      }
    } else {
      // If there was user input, store it as formatted amount
      formattedAmount = userInput;
    }
  }
</script>

<div class="border border-gray-300 shadow-md p-4 rounded-lg bg-gray-50 dark:bg-gray-800 
  {disabled ? ' opacity-50 pointer-events-none' : ''}">
  <div class="flex justify-between items-center">
    <input
      type="text"
      placeholder="0"
      value={userInput || formattedAmount}
      on:input={handleAmountInput}
      on:blur={handleBlur}
      disabled={disabled}
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
          ? 'text-red-500 dark:text-red-400 ' 
          : 'text-black dark:text-white '}
        {disabled ? 'cursor-not-allowed' : ''}
      "
    />
    <TokenDropdown 
      {tokens}
      disabled={disabled}
      selectedToken={swapPriceData.tokenIn}
      onTokenSelect={onTokenSelect} 
    />
  </div>
  <div class="flex justify-between items-center mt-2 text-sm">
    <SwapTokenPrice {swapPriceDataStore} type="sell" />
    <span>Balance: {balance}</span>
  </div>
  {#if insufficientBalance}
    <div class="text-red-500 dark:text-red-400 text-sm mt-1">
      Insufficient balance for this swap
    </div>
  {/if}
</div>
