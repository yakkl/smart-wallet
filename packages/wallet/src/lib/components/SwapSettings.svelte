<script lang="ts">
	import { type SwapPriceData } from '$lib/common';
	import type { Writable } from 'svelte/store';

  export let swapPriceDataStore: Writable<SwapPriceData>;
  export let onSlippageChange: (value: number) => void;
  export let onDeadlineChange: (value: number) => void;
  export let onPoolFeeChange: (value: number) => void;
  export let className: string = 'text-gray-700';

  const slippageOptions = [0.1, 0.5, 1, 3];
  const deadlineOptions = [10, 20, 30, 60];
  const poolFeeOptions = [500, 3000, 10000]; // Example fee tiers in basis points

  let slippageTolerance = 0.5;
  let deadline = 10;
  let poolFee = 3000;

  // Reactive store value
  let swapPriceData: SwapPriceData;

  $: { 
    swapPriceData = $swapPriceDataStore;
    slippageTolerance = swapPriceData.slippageTolerance || 0.5;
    deadline = swapPriceData.deadline || 10;
    poolFee = swapPriceData.fee || 3000;
  }


  // Reactive variable to track pool fee
  $: {
    // Ensure the selected pool fee is one of the valid options
    if (!poolFeeOptions.includes(poolFee)) {
      // If not, default to the closest match or the default
      poolFee = findClosestPoolFee(poolFee);
    }
  }

  // Helper function to find the closest pool fee
  function findClosestPoolFee(fee: number): number {
    return poolFeeOptions.reduce((prev, curr) => 
      Math.abs(curr - fee) < Math.abs(prev - fee) ? curr : prev
    );
  }

  function handleSlippageChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    slippageTolerance = value;
    onSlippageChange(value);
  }

  function handleDeadlineChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    deadline = value;
    onDeadlineChange(value);
  }

  function handlePoolFeeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    poolFee = value;
    onPoolFeeChange(value);
  }
</script>

<div class="flex justify-between items-center space-x-4 {className}">
  <div>
    <label for="slippage" class="block text-sm font-medium">
      Slippage
    </label>
    <select
      id="slippage"
      value={slippageTolerance}
      on:change={handleSlippageChange}
      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
    >
      {#each slippageOptions as option}
        <option value={option}>{option}%</option>
      {/each}
    </select>
  </div>

  <div>
    <label for="deadline" class="block text-sm font-medium">
      Deadline
    </label>
    <select
      id="deadline"
      value={deadline}
      on:change={handleDeadlineChange}
      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
    >
      {#each deadlineOptions as option}
        <option value={option}>{option} minutes</option>
      {/each}
    </select>
  </div>

  <div>
    <label for="poolFee" class="block text-sm font-medium">
      Pool Fee
    </label>
    <select
      id="poolFee"
      value={poolFee}
      on:change={handlePoolFeeChange}
      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
    >
      {#each poolFeeOptions as option}
        <option value={option}>{option / 10000}%</option>
      {/each}
    </select>
  </div>
</div>
