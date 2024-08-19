<script lang="ts">
  import { onMount } from 'svelte';
  import { ContractManager } from '$lib/plugins/ContractManager';
  import { wallet, getYakklContractStore, setYakklContractStore } from '$lib/common/stores';
  import type { ContractFunction, ContractData } from '$lib/common/interfaces';

  let contractManager: ContractManager;
  let contractData: ContractData = {
    address: '',
    abi: '',
    functions: []
  };
  let error = '';

  onMount(() => {
    const unsubscribe = wallet.subscribe(value => {
      if (value) {
        contractManager = new ContractManager(value);
      }
    });

    // Load saved contract data from store
    contractData = getYakklContractStore();

    return () => {
      unsubscribe();
    };
  });

  async function handleContractSubmit() {
    error = '';
    if (await contractManager.verifyContract(contractData.address)) {
      contractData.functions = contractManager.getContractFunctions(contractData.abi);
      setYakklContractStore(contractData);
    } else {
      error = 'Invalid contract address';
    }
  }

  async function handleFunctionCall(func: ContractFunction, event: Event) {
    error = '';
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const args = func.inputs.map(input => formData.get(input.name));

    try {
      const result = await contractManager.callContractFunction(contractData.address, contractData.abi, func.name, args);
      console.log(`${func.name} result:`, result);
      // You might want to display this result in the UI
    } catch (err) {
      error = `Error calling ${func.name}: ` + (err as Error).message;
    }
  }
</script>

<div class="contract-interaction">
  <form on:submit|preventDefault={handleContractSubmit}>
    <input 
      type="text" 
      bind:value={contractData.address} 
      placeholder="Contract Address" 
    />
    <textarea 
      bind:value={contractData.abi} 
      placeholder="Contract ABI" 
    />
    <button type="submit">Load Contract</button>
  </form>
  
  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#each contractData.functions as func (func.name)}
    <div class="function-form">
      <h3>{func.name}</h3>
      <form on:submit|preventDefault={(e) => handleFunctionCall(func, e)}>
        {#each func.inputs as input (input.name)}
          <div>
            <label>{input.name} ({input.type}): </label>
            <input type="text" name={input.name} />
          </div>
        {/each}
        <button type="submit">Call Function</button>
      </form>
    </div>
  {/each}
</div>

<style>
  .contract-interaction {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  input, textarea {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #45a049;
  }

  .error {
    color: red;
    margin-bottom: 10px;
  }

  .function-form {
    border: 1px solid #ddd;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 4px;
  }
</style>
