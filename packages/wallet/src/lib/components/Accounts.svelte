<!-- Accounts2.svelte -->
<script lang="ts">
  import { yakklAccountsStore, yakklCurrentlySelectedStore } from '$lib/common/stores';
  import { YAKKL_ZERO_ADDRESS } from '$lib/common/constants';
  import type { YakklAccount } from '$lib/common';
  import Modal from './Modal.svelte';
  import AccountListing from './AccountListing.svelte';

  export let account: YakklAccount | null = null;
  export let show = false;
  export let onAccountSelect: ((account: YakklAccount) => void) | null = null;
  export let className = 'z-[999]';

  function handleAccountSelect(selectedAccount: YakklAccount) {
    if (account !== null) {
      account = selectedAccount;
    }
    if (onAccountSelect !== null) {
      onAccountSelect(selectedAccount);
    }
    show = false;
  }

  function closeModal() {
    show = false;
  }
</script>

<div class="relative {className}">
  <Modal bind:show={show} title="Account List" description="Select the account you wish to make current" on:close={closeModal}>
    <div class="border-t border-b border-gray-500 py-4">
      <AccountListing accounts={$yakklAccountsStore} onAccountSelect={handleAccountSelect} />

      {#if $yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.address === YAKKL_ZERO_ADDRESS}
        <p class="text-lg font-bold text-red-500">There are no Portfolio Accounts to display! Create at least one Portfolio account!</p>
      {/if}
    </div>

    <svelte:fragment slot="footer">
      <p class="text-sm text-gray-500">Whatever account you select will become your <span class="font-bold underline">active</span> account!</p>
    </svelte:fragment>
  </Modal>
</div>
