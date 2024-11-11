<script lang="ts">
	
  export let slippageTolerance: number = 0.5;
  export let onSlippageChange: (value: number) => void;

  export let deadline: number = 20;
  export let onDeadlineChange: (value: number) => void;

  export let poolFee: number = 3000;
  export let onPoolFeeChange: (value: number) => void;

  export let className: string = 'text-gray-700';

  const slippageOptions = [0.1, 0.5, 1, 3];
  const deadlineOptions = [10, 20, 30, 60];
  const poolFeeOptions = [500, 3000, 10000]; // Example fee tiers in basis points

  function handleSlippageChange(event: any) {
    onSlippageChange(Number(event.target.value));
  }

  function handleDeadlineChange(event: any) {
    onDeadlineChange(Number(event.target.value));
  }

  function handlePoolFeeChange(event: any) {
    onPoolFeeChange(Number(event.target.value));
  }
</script>

<div class="flex justify-between items-center space-x-4 {className}">
  <div>
    <label for="slippage" class="block text-sm font-medium">
      Slippage
    </label>
    <select
      id="slippage"
      bind:value={slippageTolerance}
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
      bind:value={deadline}
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
      bind:value={poolFee}
      on:change={handlePoolFeeChange}
      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
    >
      {#each poolFeeOptions as option}
        <option value={option}>{option / 10000}%</option>
      {/each}
    </select>
  </div>
</div>
