<script lang="ts">
  import { transaction } from './stores';
  import { sendTransaction } from './services';

  export let onClose;

  const confirmTransaction = async () => {
    try {
      const result = await sendTransaction($transaction);
      onClose();
    } catch (error) {
      console.log('Transaction failed:', false, error);
    }
  };
</script>

<div class="modal">
  <h2>Confirm Transaction</h2>
  <p>Recipient: {$transaction.toAddress}</p>
  <p>Amount: {$transaction.amount}</p>
  <p>Gas Price: {$transaction.gasPrice}</p>
  <button on:click={confirmTransaction}>Confirm</button>
  <button on:click={onClose}>Cancel</button>
</div>

<style>
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    z-index: 1000;
  }
  button {
    margin-right: 1rem;
  }
</style>
