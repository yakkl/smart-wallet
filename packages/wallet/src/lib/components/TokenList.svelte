<script lang="ts">
  import type { TokenStorage } from '$lib/common';
  import TokenForm from './TokenForm.svelte';
  import Confirmation from './Confirmation.svelte';
  import EditControls from './EditControls.svelte';

  interface Props {
    tokens?: TokenStorage[];
    onTokenSelect?: (token: TokenStorage) => void;
    onTokenUpdate?: (token: TokenStorage) => void;
    onTokenDelete?: (token: TokenStorage) => void;
  }

  let {
    tokens = [],
    onTokenSelect = () => {},
    onTokenUpdate = () => {},
    onTokenDelete = () => {}
  }: Props = $props();

  let selectedToken: TokenStorage | null = $state(null);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);

  function handleEdit(token: TokenStorage) {
    selectedToken = token;
    showEditModal = true;
  }

  function handleDelete(token: TokenStorage) {
    selectedToken = token;
    showDeleteModal = true;
  }

  function confirmDelete() {
    if (selectedToken) {
      onTokenDelete(selectedToken);
      showDeleteModal = false;
      selectedToken = null;
    }
  }
</script>

<ul class="divide-y divide-gray-300">
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
          <!-- <p class="text-xs text-gray-500">{token.balance || 0}</p> -->
        </div>
      </button>
      <EditControls
        onEdit={() => handleEdit(token)}
        onDelete={() => handleDelete(token)}
      />
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
