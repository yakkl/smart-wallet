<script lang="ts">
  import type { TokenData } from '$lib/common';
  import TokenForm from './TokenForm.svelte';
  import Confirmation from './Confirmation.svelte';
  import EditControls from './EditControls.svelte';

  interface Props {
    tokens?: TokenData[];
    onTokenSelect?: (token: TokenData) => void;
    onTokenUpdate?: (token: TokenData) => void;
    onTokenDelete?: (token: TokenData) => void;
  }

  let {
    tokens = [],
    onTokenSelect = () => {},
    onTokenUpdate = () => {},
    onTokenDelete = () => {}
  }: Props = $props();

  let selectedToken: TokenData | null = $state(null);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);

  function handleEdit(token: TokenData) {
    if (token?.customDefault === 'custom') {
      selectedToken = token;
      showEditModal = true;
    }
  }

  function handleDelete(token: TokenData) {
    if (token?.customDefault === 'custom') {
      selectedToken = token;
      showDeleteModal = true;
    }
  }

  function confirmDelete() {
    if (selectedToken && selectedToken?.customDefault === 'custom') {
      onTokenDelete(selectedToken);
      showDeleteModal = false;
      selectedToken = null;
    }
  }
</script>

<ul class="divide-y divide-gray-300">
  {console.log('Token List:', tokens)}
  {#each tokens as token, index}
    <li
      class="relative py-4 flex justify-between items-center"
      class:bg-purple-100={index % 2 === 0}
      class:bg-blue-100={index % 2 !== 0}
      class:hover:bg-purple-200={index % 2 === 0}
      class:hover:bg-blue-200={index % 2 !== 0}
    >
      <button
        class="flex items-start flex-1 cursor-pointer px-2"
        onclick={() => onTokenSelect(token)}
      >
        <div>
          <p class="text-sm font-medium text-gray-900">{token.name}</p>
          <p class="text-xs text-gray-500">{token.symbol} - {token.address}</p>
          <p class="text-xs text-gray-500">Balance: {token.balance ?? 0}</p>
        </div>
      </button>
      {#if token?.customDefault === 'custom'} <!-- Only show controls if custom -->
      <EditControls
        onEdit={() => handleEdit(token)}
        onDelete={() => handleDelete(token)}
      />
      {/if}
    </li>
  {/each}
</ul>

<TokenForm
  bind:show={showEditModal}
  token={selectedToken}
  onSubmit={onTokenUpdate}
/>

<Confirmation
  bind:show={showDeleteModal}
  onConfirm={confirmDelete}
  title="Delete Token"
  message="Are you sure you want to delete this token? This action cannot be undone."
/>
