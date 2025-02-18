<script lang="ts">
	import { log } from '$lib/plugins/Logger';
  import { formData, formErrors, validateForm } from './validation';

  let data = {
    toAddress: '',
    amount: '',
  };

  let errors: Record<string, string | undefined> = {};

  $: formErrors.subscribe((value) => {
    errors = value;
  });

  async function handleSubmit() {
    const isValid = await validateForm(data);
    if (isValid) {
      log.info('Form is valid, submitting:', data);
      // Perform the transaction here
    } else {
      log.error('Form validation failed:', errors);
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <label>
    To Address:
    <input type="text" bind:value={data.toAddress} />
    {#if errors.toAddress}
      <small class="text-red-600">{errors.toAddress}</small>
    {/if}
  </label>

  <label>
    Amount:
    <input type="number" bind:value={data.amount} />
    {#if errors.amount}
      <small class="text-red-600">{errors.amount}</small>
    {/if}
  </label>

  <button type="submit">Send</button>
</form>
