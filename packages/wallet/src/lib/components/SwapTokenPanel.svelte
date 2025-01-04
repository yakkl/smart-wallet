<script lang="ts">
  import type { Writable } from 'svelte/store';
  import TokenDropdown from './TokenDropdown.svelte';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import type { SwapToken, SwapPriceData } from '$lib/common/interfaces';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { debounce } from 'lodash-es';
  import { toBigInt } from '$lib/common';

  interface Props {
    type?: 'sell' | 'buy';
    tokens?: SwapToken[];
    disabled?: boolean;
    readOnly?: boolean;
    insufficientBalance?: boolean;
    balance?: string;
    resetValues?: boolean;
    swapPriceDataStore: Writable<SwapPriceData>;
    onTokenSelect: (token: SwapToken) => void;
    onAmountChange: (amount: string) => void;
  }

  let {
    type = 'sell',
    tokens = [],
    disabled = false,
    readOnly = false,
    insufficientBalance = $bindable(false),
    balance = $bindable('0'),
    resetValues = $bindable(false),
    swapPriceDataStore,
    onTokenSelect,
    onAmountChange
  }: Props = $props();

  // Reactive store value
  let swapPriceData = $state($swapPriceDataStore);

  // Input state management
  let userInput = $state('');
  let formattedAmount = $state('');

  function formatAmount(amount: bigint, decimals: number): string {
    if (amount === 0n) return '';

    const formattedValue = ethersv6.formatUnits(amount, decimals);
    const [integerPart, decimalPart] = formattedValue.split('.');
    if (!decimalPart) return integerPart;

    const trimmedDecimal = decimalPart.replace(/0+$/, '');
    return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
  }

  const debouncedAmountChange = debounce((value: string) => {
    onAmountChange(value);
  }, 300);

  function handleAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    value = value.replace(/[^0-9.]/g, '');

    const parts = value.split('.');
    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    if (parts[1] && parts[1].length > 6) {
      value = `${parts[0]}.${parts[1].slice(0, 6)}`;
    }

    userInput = value;

    if (value !== '' && value !== '.') {
      debouncedAmountChange(value);
    }
  }

  function handleBlur(event: FocusEvent) {
    const value = (event.target as HTMLInputElement).value;

    if (value !== '' && value !== '.') {
      onAmountChange(value);
    }
  }

  // Replace run with $effect for store subscription
  $effect(() => {
    swapPriceData = $swapPriceDataStore;
  });

  // Replace run with $effect for reset values
  $effect(() => {
    if (resetValues) {
      userInput = '';
      formattedAmount = '';
      balance = '0';
      insufficientBalance = false;
      swapPriceData.amountIn = 0n;
      swapPriceData.amountOut = 0n;
      resetValues = false;
    }
  });

  // Replace run with $effect for amount formatting
  $effect(() => {
    if (type === 'sell') {
      if (toBigInt(swapPriceData.amountIn) > 0n) {
        formattedAmount = formatAmount(
          toBigInt(swapPriceData.amountIn) || 0n,
          swapPriceData.tokenIn.decimals
        );
      } else {
        formattedAmount = '';
      }
    } else {
      if (toBigInt(swapPriceData.amountOut) > 0n) {
        formattedAmount = formatAmount(
          toBigInt(swapPriceData.amountOut) || 0n,
          swapPriceData.tokenOut.decimals
        );
      } else {
        formattedAmount = '';
      }
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
      {disabled}
      readonly={readOnly}
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
      {disabled}
      selectedToken={type === 'sell' ? swapPriceData.tokenIn : swapPriceData.tokenOut}
      {onTokenSelect}
    />
  </div>
  <div class="flex justify-between items-center mt-2 text-sm">
    <SwapTokenPrice {swapPriceDataStore} {type} />
    {#if type === 'sell'}
      Balance: {balance}
    {/if}
  </div>
  {#if insufficientBalance}
    <div class="text-red-500 dark:text-red-400 text-sm mt-1">
      Insufficient balance for this swap
    </div>
  {/if}
</div>
