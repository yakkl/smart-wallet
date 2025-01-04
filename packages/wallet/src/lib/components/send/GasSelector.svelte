<script lang="ts">
  import { transaction } from './stores';
  import { gasEstimates } from './services';
  import { derived } from 'svelte/store';

  const gasFees = derived(transaction, async ($transaction) => {
    return await gasEstimates($transaction.gasPrice);
  });
</script>

<div>
  <h3>Gas Fee Options</h3>
  <div>
    {#await gasFees}
      <p>Loading gas fees...</p>
    {:then fees}
      <ul>
        <li>Low: {fees.low} GWEI</li>
        <li>Market: {fees.market} GWEI</li>
        <li>Priority: {fees.priority} GWEI</li>
      </ul>
    {/await}
  </div>
</div>

<style>
  ul {
    padding: 0;
    list-style: none;
  }
  li {
    margin: 0.5rem 0;
  }
</style>
