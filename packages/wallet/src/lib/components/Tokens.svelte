<script lang="ts">
  import { setYakklTokensStorage, yakklTokensStore } from '$lib/common/stores';
  import { type TokenStorage } from '$lib/common';
  import Modal from './Modal.svelte';
  import TokenList from './TokenList.svelte';
  import TokenForm from './TokenForm.svelte';

  interface Props {
    show?: boolean;
    onTokenSelect?: ((token: TokenStorage) => void) | null;
    className?: string;
  }

  let { show = $bindable(false), onTokenSelect = null, className = 'z-[899]' }: Props = $props();

  let showAddModal = $state(false);
  let tokens: TokenStorage[] = $state([]);

  $effect(() => {
    tokens = $yakklTokensStore;
  });

  function handleTokenSelect(selectedToken: TokenStorage) {
    if (onTokenSelect !== null) {
      onTokenSelect(selectedToken);
    }
    show = false;
  }

  function handleTokenAdd(token: TokenStorage) {
    yakklTokensStore.update((tokens) => [...tokens, token]);
    setYakklTokensStorage($yakklTokensStore);
    showAddModal = false;
  }

  function handleTokenDelete(deletedToken: TokenStorage) {
    yakklTokensStore.update((tokens) => {
      const updatedTokens = tokens.filter((t) => t.address !== deletedToken.address);
      setYakklTokensStorage(updatedTokens);
      return updatedTokens;
    });
  }

  function handleTokenUpdate(updatedToken: TokenStorage) {
    yakklTokensStore.update((tokens) => {
      const updatedTokens = tokens.map((t) => (t.address === updatedToken.address ? updatedToken : t));
      setYakklTokensStorage(updatedTokens);
      return updatedTokens;
    });
  }

  function closeModal() {
    show = false;
  }
</script>

<!-- <div class="relative {className}"> -->
  <Modal
    bind:show={show}
    title="Token List"
    description="Manage your custom tokens"
    onClose={closeModal}
    {className}
  >
    <div class="border-t border-b border-gray-200 py-4">
      <TokenList
        tokens={tokens}
        onTokenSelect={handleTokenSelect}
        onTokenUpdate={handleTokenUpdate}
        onTokenDelete={handleTokenDelete}
      />

      {#if $yakklTokensStore.length === 0}
        <div class="text-center text-md text-gray-700 dark:text-gray-400">
          No custom tokens added yet! Use the button below to add new tokens.
        </div>
      {/if}
    </div>

    {#snippet footer()}

        <button onclick={() => {showAddModal=true; show=false;}} class="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">+ Add Token</button>
        <p class="text-sm text-gray-500 mt-2">
          Manage your custom tokens with ease.
        </p>

      {/snippet}
  </Modal>
<!-- </div> -->

<TokenForm
  bind:show={showAddModal}
  onSubmit={handleTokenAdd}
/>
