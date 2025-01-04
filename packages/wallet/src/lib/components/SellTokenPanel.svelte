<script lang="ts">
  import type { Writable } from 'svelte/store';
  import TokenDropdown from './TokenDropdown.svelte';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import type { SwapToken, SwapPriceData } from '$lib/common/interfaces';
  import { debounce } from 'lodash-es';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { convertTokenToUsd, convertUsdToTokenAmount, toBigInt } from '$lib/common';
  import ToggleSwitch from './ToggleSwitch.svelte';
  import { isUsdModeStore } from '$lib/common/stores/uiStateStore';

  interface Props {
    disabled?: boolean;
    resetValues?: boolean;
    insufficientBalance?: boolean;
    balance?: string;
    swapPriceDataStore: Writable<SwapPriceData>;
    onTokenSelect: (token: SwapToken) => void;
    onAmountChange: (amount: string) => void;
  }

  let {
    disabled = false,
    resetValues = $bindable(false),
    insufficientBalance = false,
    balance = '0',
    swapPriceDataStore,
    onTokenSelect,
    onAmountChange,
  }: Props = $props();

  let userInput = $state('');
  let formattedAmount = $state('');

  // Ensure resetValues resets inputs
  $effect(() => {
    if (resetValues) {
      userInput = '';
      formattedAmount = '';
      resetValues = false;
    }
  });

  // Calculate formattedAmount dynamically
  $effect(() => {
    const tokenAmount = ethersv6.formatUnits(toBigInt($swapPriceDataStore.amountIn), $swapPriceDataStore.tokenIn.decimals);
    const usdAmount = $swapPriceDataStore.marketPriceIn > 0
      ? convertTokenToUsd(Number(tokenAmount), $swapPriceDataStore.marketPriceIn)
      : 0;

    formattedAmount = $isUsdModeStore ? usdAmount.toFixed(2) : tokenAmount;
    userInput = '';
  });

  // Debounced amount change handler
  const debouncedAmountChange = debounce((value: string) => {
    onAmountChange(value);
  }, 300);

  // Handle user input changes
  function handleAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Allow only valid numbers
    value = value.replace(/[^0-9.]/g, '');

    // Handle decimals
    const parts = value.split('.');
    if (parts.length > 2) value = `${parts[0]}.${parts.slice(1).join('')}`;

    // Limit decimal precision
    if ($isUsdModeStore && parts[1]?.length > 2) {
      value = `${parts[0]}.${parts[1].slice(0, 2)}`;
    } else if (!$isUsdModeStore) {
      const tokenDecimals = $swapPriceDataStore.tokenIn.decimals || 18;
      if (parts[1]?.length > tokenDecimals) {
        value = `${parts[0]}.${parts[1].slice(0, tokenDecimals)}`;
      }
    }

    userInput = value;
    if (value === '' || value === '.') {
      formattedAmount = '';
      debouncedAmountChange('');
    } else {
      formattedAmount = value;

      if ($isUsdModeStore) {
        const marketPrice = $swapPriceDataStore.marketPriceIn || 0;
        if (marketPrice > 0) {
          const tokenAmount = convertUsdToTokenAmount(Number(value), marketPrice, $swapPriceDataStore.tokenIn.decimals);
          debouncedAmountChange(tokenAmount.toString());
        } else {
          debouncedAmountChange('');
        }
      } else {
        debouncedAmountChange(value);
      }
    }
  }

  function handleBlur() {
    if (!userInput || userInput === '.') {
      userInput = '';
      formattedAmount = '';
    } else {
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
      disabled={disabled}
      selectedToken={$swapPriceDataStore.tokenIn}
      onTokenSelect={onTokenSelect}
    />
  </div>
  <div class="flex justify-between items-center mt-2 text-sm">
    <div class="flex items-center">
      <ToggleSwitch
        value={$isUsdModeStore}
        labelOn="USD"
        labelOff="Token"
        className="bg-purple-300"
        onChange={(value) => isUsdModeStore.set(value)} />
    </div>
    <div class="flex flex-col items-end text-right">
      <SwapTokenPrice {swapPriceDataStore} type="sell" />
      <span>Balance: {balance}</span>
    </div>
  </div>
  {#if insufficientBalance}
    <div class="text-red-500 dark:text-red-400 text-sm mt-1">
      Insufficient balance for this swap
    </div>
  {/if}
</div>

