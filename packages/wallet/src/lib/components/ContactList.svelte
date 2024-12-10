<!-- ContactList.svelte -->
<script lang="ts">
  import type { YakklContact } from '$lib/common';
  import ContactForm from './ContactForm.svelte';
  import Confirmation from './Confirmation.svelte';
  import EthereumIcon from '$lib/components/icons/EthereumIcon.svelte';
  import BaseIcon from '$lib/components/icons/BaseIcon.svelte';
  import OptimismIcon from '$lib/components/icons/OptimismIcon.svelte';
  import BitcoinIcon from '$lib/components/icons/BitcoinIcon.svelte';
  import EditControls from './EditControls.svelte';

  interface Props {
    contacts?: YakklContact[];
    onContactSelect?: (contact: YakklContact) => void;
    onContactUpdate?: (contact: YakklContact) => void;
    onContactDelete?: (contact: YakklContact) => void;
  }

  let {
    contacts = [],
    onContactSelect = () => {},
    onContactUpdate = () => {},
    onContactDelete = () => {}
  }: Props = $props();

  let selectedContact: YakklContact | null = $state(null);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);

  function handleEdit(contact: YakklContact) {
    selectedContact = contact;
    showEditModal = true;
  }

  function handleDelete(contact: YakklContact) {
    selectedContact = contact;
    showDeleteModal = true;
  }

  function handleCopy(contact: YakklContact) {
    navigator.clipboard.writeText(contact.address);
  }

  function confirmDelete() {
    if (selectedContact) {
      onContactDelete(selectedContact);
      showDeleteModal = false;
      selectedContact = null;
    }
  }
</script>

<ul class="divide-y divide-gray-300">
  {#each contacts as contact, index}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <li
      class="relative py-4 flex justify-between items-center"
      class:bg-purple-100={index % 2 === 0}
      class:bg-blue-100={index % 2 !== 0}
      class:hover:bg-purple-200={index % 2 === 0}
      class:hover:bg-blue-200={index % 2 !== 0}
    >
      <button
        class="flex items-start flex-1 cursor-pointer px-2"
        onclick={() => onContactSelect(contact)}
      >
        <div class="flex items-center">
          {#if contact.blockchain === 'Ethereum'}
            <EthereumIcon className="h-6 w-6 rounded-full mr-3" />
          {:else if contact.blockchain === 'Base'}
            <BaseIcon className="h-6 w-6 rounded-full mr-3" />
          {:else if contact.blockchain === 'Optimism'}
            <OptimismIcon className="h-6 w-6 rounded-full mr-3" />
          {:else if contact.blockchain === 'Bitcoin'}
            <BitcoinIcon className="h-6 w-6 rounded-full mr-3" />
          {/if}
          <div>
            <p class="text-sm font-medium text-gray-900">{contact.name}</p>
            {#if contact.alias}
              <p class="text-xs text-gray-500">{contact.alias}</p>
            {/if}
            <p class="text-xs text-gray-500">{contact.address}</p>
          </div>
        </div>
      </button>
      <EditControls
        onEdit={() => handleEdit(contact)}
        onDelete={() => handleDelete(contact)}
        onCopy={() => handleCopy(contact)}
      />
    </li>
  {/each}
</ul>

<ContactForm
  bind:show={showEditModal}
  contact={selectedContact}
  onSubmit={onContactUpdate}
/>

<Confirmation
  bind:show={showDeleteModal}
  onConfirm={confirmDelete}
  title="Delete Contact"
  message="Are you sure you want to delete this contact? This action cannot be undone."
/>
