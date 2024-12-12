<script lang="ts">
  import type { Writable } from 'svelte/store';
  import TokenDropdown from './TokenDropdown.svelte';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import type { SwapToken, SwapPriceData } from '$lib/common/interfaces';
  import { debounce } from 'lodash-es';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { toBigInt } from '$lib/common';

  interface Props {
    // tokens?: SwapToken[];
    disabled?: boolean;
    resetValues?: boolean;
    insufficientBalance?: boolean;
    balance?: string;
    swapPriceDataStore: Writable<SwapPriceData>;
    onTokenSelect: (token: SwapToken) => void;
    onAmountChange: (amount: string) => void;
  }

  let {
    // tokens = [],
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

  $effect(() => {
    if (resetValues) {
      userInput = '';
      formattedAmount = '';
      resetValues = false;
    }
  });

  $effect(() => {
    if (!userInput && toBigInt($swapPriceDataStore.amountIn) > 0n) {
      formattedAmount = formatAmount(toBigInt($swapPriceDataStore.amountIn), $swapPriceDataStore.tokenIn.decimals);
    } else {
      formattedAmount = userInput;
    }
  });

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
    if (parts.length > 2) value = `${parts[0]}.${parts.slice(1).join('')}`;
    if (parts[1]?.length > 6) value = `${parts[0]}.${parts[1].slice(0, 6)}`;

    userInput = value;

    if (value === '' || value === '.') {
      userInput = '';
      formattedAmount = '';
      onAmountChange('');
      return;
    }

    formattedAmount = value;
    debouncedAmountChange(value);
  }

  function handleBlur() {
    if (!userInput || userInput === '.' || userInput === '') {
      userInput = '';
      if (!formattedAmount || formattedAmount === '0') formattedAmount = '';
    } else {
      formattedAmount = userInput;
      userInput = '';
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
    <div class="flex justify-between items-center mt-2 text-sm">
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
