<script lang="ts">
  import { onMount } from 'svelte';
  import type { TokenData } from '$lib/common/interfaces';
  import LineChart from '$lib/components/LineChart.svelte';

  interface Props {
    token: TokenData;
    show?: boolean;
  }

  let { token, show = true }: Props = $props();

  let chartData: { x: Date; y: number }[] = $state([]);

  onMount(async () => {
    // Fetch historical price data based on the token and timeline
    // For simplicity, we'll mock the data here
    chartData = [
      { x: new Date('2023-05-01'), y: token.price.price - 100 },
      { x: new Date('2023-05-02'), y: token.price.price - 50 },
      { x: new Date('2023-05-03'), y: token.price.price },
    ];
  });
</script>

{#if show}
  <div class="flex flex-col items-center p-4 border border-gray-300 rounded-lg cursor-pointer text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900">
    <div class="flex items-center mb-4">
      <img src={token.logoURI} alt={token.name} class="w-8 h-8 mr-2" />
      <div class="flex flex-col">
        <div class="font-bold">{token.symbol}</div>
        <div>{token.name}</div>
      </div>
    </div>
    <div class="w-full h-24 mb-4">
      <LineChart data={chartData} />
    </div>
    <div class="text-lg font-bold">{token.price.price}</div>
  </div>
{/if}
