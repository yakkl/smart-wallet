<script lang="ts">
  import Modal from '../Modal.svelte';
  import SendForm from './SendForm.svelte';

  export let show = false; // To control modal visibility
  export let title = 'Send Crypto';
  export let description = 'Fill in the details below to send cryptocurrency.';
  export let className = ''; // Additional classes for the modal
  export let onClose = () => (show = false); // Callback for closing the modal
</script>

<Modal
  bind:show
  {title}
  {description}
  {className}
  onClose={onClose}
>
  <!-- <svelte:fragment slot="children"> -->
    <SendForm />
  <!-- </svelte:fragment> -->

  <!-- <svelte:fragment slot="footer"> -->
    <div class="flex justify-end">
      <button
        type="button"
        class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
        onclick={onClose}
      >
        Cancel
      </button>
    </div>
  <!-- </svelte:fragment> -->
</Modal>
