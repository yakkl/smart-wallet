<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { Writable } from 'svelte/store';
  import TokenDropdown from './TokenDropdown.svelte';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import type { SwapToken, SwapPriceData } from '$lib/common/interfaces';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { debounce } from 'lodash-es';
  import { toBigInt } from '$lib/common';


  interface Props {
    // Component props
    tokens?: SwapToken[];
    disabled?: boolean;
    insufficientBalance?: boolean;
    balance?: string;
    resetValues?: boolean;
    swapPriceDataStore: Writable<SwapPriceData>;
    onTokenSelect: (token: SwapToken) => void;
    onAmountChange: (amount: string) => void;
  }

  let {
    tokens = [],
    disabled = false,
    insufficientBalance = false,
    balance = '0',
    resetValues = $bindable(false),
    swapPriceDataStore,
    onTokenSelect,
    onAmountChange
  }: Props = $props();

  // Reactive store value
  let swapPriceData: SwapPriceData = $state();

  // Input state management
  let userInput = $state(''); // Temporary user input
  let formattedAmount = $state(''); // Formatted display amount



  // Amount formatting utility
  function formatAmount(amount: bigint, decimals: number): string {
    if (amount === 0n) return '';

    const formattedValue = ethersv6.formatUnits(amount, decimals);

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
  run(() => {
    swapPriceData = $swapPriceDataStore;
  });
  // Reset handling
  run(() => {
    if (resetValues) {
      userInput = '';
      formattedAmount = '';
      resetValues = false;
    }
  });
  // Amount formatting from store updates
  run(() => {
    if (!userInput && toBigInt(swapPriceData.amountIn) > 0n) {
      formattedAmount = formatAmount(
        toBigInt(swapPriceData.amountIn),
        swapPriceData.tokenIn.decimals
      );
    } else {
      formattedAmount = userInput;
    }
  });
</script>

<div class="border border-gray-300 shadow-md p-4 rounded-lg bg-gray-50 dark:bg-gray-800
  {disabled ? ' opacity-50 pointer-events-none' : ''}">
  <div class="flex justify-between items-center">
    <input
      type="text"
      placeholder="0"
      value={userInput || formattedAmount}
      oninput={handleAmountInput}
      onblur={handleBlur}
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
