<script lang="ts">
  import {
    setYakklTokenDataCustomStorage,
    yakklCombinedTokenStore,
    yakklCurrentlySelectedStore,
    yakklTokenDataCustomStore,
  } from '$lib/common/stores';
  import { getInstances, type TokenData } from '$lib/common';
  import Modal from './Modal.svelte';
  import TokenList from './TokenList.svelte';
  import TokenForm from './TokenForm.svelte';
  import { onMount } from 'svelte';
  import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
  import type { Provider } from '$lib/plugins/Provider';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';

  interface Props {
    show?: boolean;
    onTokenSelect?: (token: TokenData) => void;
    className?: string;
  }

  let { show = $bindable(false), onTokenSelect = null, className = 'z-[899]' }: Props = $props();

  let showAddModal = $state(false);
  let tokens = $state<TokenData[]>([]); // Combined tokens for display
  let provider: Provider | null = null;
  let tokenService: TokenService<any> | null = null;

  // Fetch instances and setup provider/tokenService
  onMount(async () => {
    const instances = await getInstances();
    if (instances.length > 0) {
      provider = instances[1];
      tokenService = instances[3];
    }
  });

  // Subscribe to the combined token store for display
  $effect(() => {
    tokens = $yakklCombinedTokenStore; // Reactive combined store
  });

  function handleTokenSelect(selectedToken: TokenData) {
    if (onTokenSelect !== null) {
      onTokenSelect(selectedToken);
    }
    show = false;
  }

  async function handleTokenAdd(token: TokenData) {
    if (token?.customDefault === 'custom') {
      const balance = await getTokenBalance(
        token,
        $yakklCurrentlySelectedStore.shortcuts.address,
        provider,
        tokenService
      );
      token.balance = balance;
      yakklTokenDataCustomStore.update((tokens) => [...tokens, token]);
      setYakklTokenDataCustomStorage($yakklTokenDataCustomStore);
    }
    showAddModal = false;
  }

  function handleTokenDelete(deletedToken: TokenData) {
    yakklTokenDataCustomStore.update((tokens) => {
      const updatedTokens = tokens.filter((t) => t.address !== deletedToken.address);
      setYakklTokenDataCustomStorage(updatedTokens);
      return updatedTokens;
    });
  }

  function handleTokenUpdate(updatedToken: TokenData) {
    yakklTokenDataCustomStore.update((tokens) => {
      const updatedTokens = tokens.map((t) => (t.address === updatedToken.address ? updatedToken : t));
      setYakklTokenDataCustomStorage(updatedTokens);
      return updatedTokens;
    });
  }

  function closeModal() {
    show = false;
  }
</script>

<Modal
  bind:show={show}
  title="Token List"
  description="Manage your tokens"
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

    {#if $yakklTokenDataCustomStore.length === 0}
      <div class="text-center text-md text-gray-700 dark:text-gray-400">
        No custom tokens added yet! Use the button below to add new tokens.
      </div>
    {/if}
  </div>

  {#snippet footer()}

      <button onclick={() => { showAddModal = true; show = false; }} class="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        + Add Token
      </button>
      <p class="text-sm text-gray-500 mt-2">
        Manage your custom tokens with ease.
      </p>

    {/snippet}
</Modal>

<TokenForm bind:show={showAddModal} onSubmit={handleTokenAdd} />
