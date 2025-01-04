<!-- Contacts.svelte -->
<script lang="ts">
  import { setYakklContactsStorage, yakklContactsStore } from '$lib/common/stores';
  import { type YakklContact } from '$lib/common';
  import Modal from './Modal.svelte';
  import ContactList from './ContactList.svelte';
  import ContactForm from './ContactForm.svelte';

  interface Props {
    show?: boolean;
    onContactSelect?: ((contact: YakklContact) => void) | null;
    className?: string;
  }

  let { show = $bindable(false), onContactSelect = null, className = 'z-[899]' }: Props = $props();

  let showAddModal = $state(false);
  let contacts: YakklContact[] = $state([]);

  $effect(() => {
    contacts = $yakklContactsStore;
  });

  function handleContactSelect(selectedContact: YakklContact) {
    if (onContactSelect !== null) {
      onContactSelect(selectedContact);
    }
    show = false;
  }

  function handleContactAdd(contact: YakklContact) {
    yakklContactsStore.update((contacts) => [...contacts, contact]);
    setYakklContactsStorage($yakklContactsStore);  // Save to local storage - make sure contact is saved. If not then it will be lost.
    showAddModal = false;
  }

  function handleContactDelete(deletedContact: YakklContact) {
    yakklContactsStore.update((contacts) => {
      const updatedContacts = contacts.filter((c) => c.address !== deletedContact.address);
      setYakklContactsStorage(updatedContacts);
      return updatedContacts;
    });
  }

  function handleContactUpdate(updatedContact: YakklContact) {
    yakklContactsStore.update((contacts) => {
      const updatedContacts = contacts.map((c) => (c.address === updatedContact.address ? updatedContact : c));
      setYakklContactsStorage(updatedContacts);
      return updatedContacts;
    });
  }

  function closeModal() {
    show = false;
  }

</script>

<!-- <div class="relative {className}"> -->
  <Modal
    bind:show={show}
    title="Contact List"
    description="Select the contact you wish to send/transfer to"
    onClose={closeModal}
    {className}
  >
    <div class="border-t border-b border-gray-200 py-4">
      <ContactList
        contacts={contacts}
        onContactSelect={handleContactSelect}
        onContactUpdate={handleContactUpdate}
        onContactDelete={handleContactDelete}
      />

      {#if $yakklContactsStore.length === 0}
        <div class="text-center text-md text-gray-700 dark:text-gray-400">
          There are currently no contacts! You can add contacts in the 'Accounts' area.
        </div>
      {/if}
    </div>

    {#snippet footer()}

        <button onclick={() => showAddModal = true} class="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">+ Add Contact</button>
        <p class="text-sm text-gray-500 mt-2">
          The selected contact will be used for sending/transferring.
        </p>

      {/snippet}
  </Modal>
<!-- </div> -->

<ContactForm
  bind:show={showAddModal}
  onSubmit={handleContactAdd}
/>
