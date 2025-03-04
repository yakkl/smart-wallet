<!-- BuyTokenPanel.svelte -->
<script lang="ts">
  import type { Writable } from 'svelte/store';
  import TokenDropdown from './TokenDropdown.svelte';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import type { SwapToken, SwapPriceData } from '$lib/common/interfaces';
  import { debounce } from 'lodash-es';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { toBigInt } from '$lib/common';
  import NumericInput from './NumericInput.svelte';
  import { log } from '$plugins/Logger';

  interface Props {
    disabled?: boolean;
    resetValues?: boolean;
    swapPriceDataStore: Writable<SwapPriceData>;
    onTokenSelect: (token: SwapToken) => void;
    onAmountChange: (amount: string) => void;
    lastModifiedPanel?: string;
  }

  let {
    disabled = false,
    resetValues = $bindable(false),
    swapPriceDataStore,
    onTokenSelect,
    onAmountChange,
    lastModifiedPanel = $bindable('sell'),
  }: Props = $props();

  let userInput = $state('');
  let formattedAmount = $state('');

  // Reset handling
  $effect(() => {
    if (resetValues) {
      userInput = '';
      formattedAmount = '';
      resetValues = false;
    }
  });

  // Update display amount when quote changes from sell panel
  $effect(() => {
    if (lastModifiedPanel === 'sell') {  // Removed the !userInput check
      userInput = ''; // Clear user input when sell panel changes
      const tokenAmount = ethersv6.formatUnits(
        toBigInt($swapPriceDataStore.amountOut),
        $swapPriceDataStore.tokenOut.decimals
      );
      formattedAmount = tokenAmount;
    }
  });

  const debouncedAmountChange = debounce((value: string) => {
    onAmountChange(value);
  }, 300);

  function handleAmountInput(value: string) {
    lastModifiedPanel = 'buy';

    if (!value) {
      userInput = '';
      formattedAmount = '';
      debouncedAmountChange('');
      return;
    }

    userInput = value;
    formattedAmount = value;
    debouncedAmountChange(value);
  }

  function handleTokenSelection(token: SwapToken) {
    userInput = '';
    formattedAmount = '';
    onTokenSelect(token);
  }

  function handleBlur(value: string) {
    if (!value) {
      userInput = '';
      formattedAmount = '';
    }
  }
</script>

<div class="border border-gray-300 shadow-md p-4 rounded-lg bg-gray-50 dark:bg-gray-800
  {disabled ? ' opacity-50 pointer-events-none' : ''}">
  <div class="flex justify-between items-center">
    <NumericInput
      value={userInput || formattedAmount}
      onChange={handleAmountInput}
      onBlur={handleBlur}
      disabled={disabled}
      className="
        bg-transparent
        text-3xl
        font-bold
        w-1/2
        mr-4
        focus:outline-none
        focus:border-b-2
        focus:border-blue-500
        text-black dark:text-white
        {disabled ? 'cursor-not-allowed' : ''}
      "
    />
    <TokenDropdown
      disabled={disabled}
      selectedToken={$swapPriceDataStore.tokenOut}
      onTokenSelect={handleTokenSelection}
    />
  </div>
  <div class="flex justify-between items-center mt-2 text-sm">
    <SwapTokenPrice {swapPriceDataStore} type="buy" />
  </div>
</div>




<!-- <script lang="ts">
  import type { Writable } from 'svelte/store';
  import TokenDropdown from './TokenDropdown.svelte';
  import SwapTokenPrice from './SwapTokenPrice.svelte';
  import type { SwapToken, SwapPriceData } from '$lib/common/interfaces';
  import { debounce } from 'lodash-es';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { convertTokenToUsd, convertUsdToTokenAmount, toBigInt } from '$lib/common';
  import { isUsdModeStore } from '$lib/common/stores/uiStateStore';

  interface Props {
    disabled?: boolean;
    resetValues?: boolean;
    swapPriceDataStore: Writable<SwapPriceData>;
    onTokenSelect: (token: SwapToken) => void;
    onAmountChange: (amount: string) => void;
  }

  let {
    disabled = false,
    resetValues = $bindable(false),
    swapPriceDataStore,
    onTokenSelect,
    onAmountChange,
  }: Props = $props();

  // Input states
  let userInput = $state('');
  let formattedAmount = $state('');

  // Reset handling
  $effect(() => {
    if (resetValues) {
      userInput = '';
      formattedAmount = '';
      resetValues = false;
    }
  });

  // Sync formatted amount with store data
  $effect(() => {
    const tokenAmount = ethersv6.formatUnits(toBigInt($swapPriceDataStore.amountOut), $swapPriceDataStore.tokenOut.decimals);

    // Convert token amount to USD
    const usdAmount = $swapPriceDataStore.marketPriceOut > 0
      ? convertTokenToUsd(Number(tokenAmount), $swapPriceDataStore.marketPriceOut)
      : 0;

    const displayAmount = $isUsdModeStore ? usdAmount.toFixed(2) : tokenAmount;

    if (!userInput) {
      formattedAmount = displayAmount;
    }
  });

  // Debounced amount change handler
  const debouncedAmountChange = debounce((value: string) => {
    onAmountChange(value);
  }, 300);

  // Handle input changes
  function handleAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Sanitize input: Allow only numbers and a single dot
    value = value.replace(/[^0-9.]/g, '');

    // Split input into integer and decimal parts
    const parts = value.split('.');
    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    // Adjust decimal precision based on mode
    if ($isUsdModeStore) {
      // Limit to 2 decimal places for USD
      if (parts[1]?.length > 2) {
        value = `${parts[0]}.${parts[1].slice(0, 2)}`;
      }
    } else {
      // Use tokenOut decimals for precision
      const tokenDecimals = $swapPriceDataStore.tokenOut.decimals || 18;
      if (parts[1]?.length > tokenDecimals) {
        value = `${parts[0]}.${parts[1].slice(0, tokenDecimals)}`;
      }
    }

    if (userInput !== value) {
      userInput = value;

      if (value === '' || value === '.') {
        userInput = '';
        formattedAmount = '';
        debouncedAmountChange('');
        return;
      }

      formattedAmount = value;

      if ($isUsdModeStore) {
        // Convert USD value to token quantity
        const marketPrice = $swapPriceDataStore.marketPriceOut || 0;
        if (marketPrice > 0) {
          const tokenAmount = convertUsdToTokenAmount(Number(value), marketPrice, $swapPriceDataStore.tokenOut.decimals);
          debouncedAmountChange(tokenAmount.toString());
        } else {
          debouncedAmountChange('');
        }
      } else {
        // Pass the token quantity directly
        debouncedAmountChange(value);
      }
    }
  }

  // Handle blur (input losing focus)
  function handleBlur() {
    if (!userInput || userInput === '.' || userInput === '') {
      userInput = '';
      if (!formattedAmount || formattedAmount === '0') formattedAmount = '';
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
        text-black dark:text-white
        {disabled ? 'cursor-not-allowed' : ''}
      "
    />
    <TokenDropdown
      disabled={disabled}
      selectedToken={$swapPriceDataStore.tokenOut}
      onTokenSelect={onTokenSelect}
    />
  </div>
  <div class="flex justify-between items-center mt-2 text-sm">
    <SwapTokenPrice {swapPriceDataStore} type="buy" />
  </div>
</div> -->
