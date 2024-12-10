<!-- GasFeeManager.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { wallet } from '$lib/common/stores';
	import { BigNumber } from '$lib/common/bignumber';
  import type { GasEstimate, HistoricalGasData, GasPrediction } from '$lib/common/gas-types';
  import { Line } from 'svelte-chartjs';

  // TODO: Implement the GasFeeManager component to pick from ranges of gas fees

  let gasEstimate: GasEstimate = $state();
  let historicalData: HistoricalGasData[] = $state();
  let predictions: GasPrediction[] = $state();
  let customGasPrice: bigint = $state();
  let customPriorityFee: bigint = $state();

  onMount(async () => {
    await updateGasEstimate();
    await updateHistoricalData();
    await updatePredictions();
  });

  async function updateGasEstimate() {
    gasEstimate = await $wallet!.getGasEstimate({
      to: "0x0000000000000000000000000000000000000000",
      from: "0x0000000000000000000000000000000000000000",
      value: "0",
      chainId: $wallet?.getChainId() ?? 1
    }) ?? null;
  }

  async function updateHistoricalData() {
    historicalData = await $wallet?.getHistoricalGasData(24 * 60 * 60) ?? [];
  }

  async function updatePredictions() {
    predictions = await $wallet?.predictFutureFees(24 * 60 * 60) ?? [];
  }

  function applyCustomGasFees() {
    if (gasEstimate) {
      gasEstimate.feeEstimate.totalFee = customGasPrice.toString();
      gasEstimate.feeEstimate.priorityFee = customPriorityFee.toString();
      // Update the wallet or transaction with the new gas fees
    }
  }

  let chartData = $derived({
  labels: [...historicalData, ...predictions].map(d => new Date(d.timestamp * 1000).toLocaleString()),
  datasets: [
    {
      label: 'Base Fee',
      data: [...historicalData.map(d => BigNumber.from(d.baseFee).toNumber() || 0), ...predictions.map(d => BigNumber.from(d.estimatedBaseFee).toNumber() || 0)],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    },
    {
      label: 'Priority Fee',
      data: [...historicalData.map(d => BigNumber.from(d.priorityFee).toNumber() || 0), ...predictions.map(d => BigNumber.from(d.estimatedPriorityFee).toNumber() || 0)],
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }
  ]
});
</script>

<div>
  <h2>Gas Fee Manager</h2>
  <button onclick={updateGasEstimate}>Refresh Gas Estimate</button>

  {#if gasEstimate}
  <p>Estimated Gas Limit: {BigNumber.from(gasEstimate.gasLimit).toString()}</p>
  <p>Base Fee: {BigNumber.from(gasEstimate.feeEstimate.baseFee).toString()}</p>
  <p>Priority Fee: {BigNumber.from(gasEstimate.feeEstimate.priorityFee).toString()}</p>
  <p>Total Fee: {BigNumber.from(gasEstimate.feeEstimate.totalFee).toString()}</p>

    <input type="number" bind:value={customGasPrice} placeholder="Custom Gas Price" />
    <input type="number" bind:value={customPriorityFee} placeholder="Custom Priority Fee" />
    <button onclick={applyCustomGasFees}>Apply Custom Fees</button>
  {/if}

  <h3>Historical and Predicted Gas Fees</h3>
  <Line data={chartData} options={{ responsive: true }} />
</div>
