<!-- ContactForm.svelte -->
<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import { debug_log, type YakklContact } from '$lib/common';
  import Modal from './Modal.svelte';
  import { dateString } from '$lib/common/datetime';
  import { onMount } from 'svelte';
  import { yakklCurrentlySelectedStore, yakklContactsStore } from '$lib/common/stores';
  import WalletManager from '$lib/plugins/WalletManager';
  import type { Wallet } from '$lib/plugins/Wallet';
  import { VERSION } from '$lib/common/constants';
	import { log } from '$lib/plugins/Logger';

  interface Props {
    // import { Input } from './ui/input';
    show?: boolean;
    contact?: YakklContact | null;
    className?: string;
    onSubmit?: (contact: YakklContact) => void;
  }

  let { show = $bindable(false), contact=null, className='z-[999]', onSubmit = () => {} }: Props = $props();

  const blockchains = ['Ethereum', 'Base', 'Optimism', 'Bitcoin'];
  let wallet: Wallet;
  let currentlySelected;
  let addressType = 'EOA';

  const { form, errors, handleChange, handleSubmit, updateInitialValues } = createForm({
    initialValues: {
      blockchain: 'Ethereum',
      name: '',
      address: '',
      alias: '',
      note: '',
    },
    validationSchema: yup.object().shape({
      blockchain: yup.string().required('Please select a blockchain'),
      name: yup.string().required('Please enter a contact name'),
      address: yup.string().required('Please enter a contact address'),
      alias: yup.string().optional(),
      note: yup.string().optional(),
    }),
    onSubmit: async (values) => {
      try {
        const verified = await verifyContact(values.name, values.address, values.alias ? values.alias : '', values.note ? values.note : '');
        if (verified) {
          const updatedContact: YakklContact = contact
            ? {
                ...contact,
                ...values,
                addressType: addressType,
                version: $yakklCurrentlySelectedStore!.version ?? VERSION,
                updateDate: dateString(),
              }
            : {
                id: crypto.randomUUID(),
                ...values,
                addressType: addressType,
                version: $yakklCurrentlySelectedStore!.version ?? VERSION,
                createDate: dateString(),
                updateDate: dateString(),
              };
          onSubmit(updatedContact);
          show = false;
        } else {
          alert('Unable to verify contact before processing. There could be a duplicate contact or invalid address.');
        }
      } catch (e) {
        log.error('Error processing contact:', e);
      }
    },
  });

  onMount(async () => {
    currentlySelected = $yakklCurrentlySelectedStore;
    wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected!.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
  });

  async function verifyContact(fname: string, faddress: string, falias: string, fnote: string) {
    let resolvedAddr = null;
    const blockchain = wallet.getBlockchain();

    const isValid = blockchain.isAddress(faddress);
    if (!isValid) {
      return false;
    }

    const isSmartContract = blockchain.isSmartContractSupported() && await blockchain.isSmartContract(faddress);
    addressType = isSmartContract ? 'SC' : 'EOA';

    // Check for duplicates
    const contacts = $yakklContactsStore;
    const isDuplicate = contacts.some(c => c.name === fname || c.address === faddress); // alias can be blank so not checking for duplicates
    if (isDuplicate && !contact) {
      return false;
    }

    return true;
  }

  function resetForm() {
    updateInitialValues({
      blockchain: 'Ethereum',
      name: '',
      address: '',
      alias: '',
      note: '',
    });
  }

  $effect(() => {
    if (contact) {
      updateInitialValues({
        blockchain: contact.blockchain,
        name: contact.name,
        address: contact.address,
        alias: contact.alias || '',
        note: contact.note || '',
      });
    } else {
      resetForm();
    }
  });
</script>

<Modal bind:show title={contact ? 'Edit Contact' : 'Add Contact'} {className}>
  <form onsubmit={handleSubmit} class="space-y-4 p-6">
    <div>
      <label for="blockchain" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Blockchain</label>
      <select id="blockchain" class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.blockchain} onchange={handleChange}>
        {#each blockchains as blockchain}
          <option value={blockchain}>{blockchain}</option>
        {/each}
      </select>
      {#if $errors.blockchain}
        <p class="mt-2 text-sm text-red-600">{$errors.blockchain}</p>
      {/if}
    </div>

    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
      <input type="text" id="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.name} onchange={handleChange} />
      {#if $errors.name}
        <p class="mt-2 text-sm text-red-600">{$errors.name}</p>
      {/if}
    </div>

    <div>
      <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Address</label>
      <input type="text" id="address" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focusring:indigo-500 sm:text-sm text-gray-800" bind:value={$form.address} onchange={handleChange} />
      {#if $errors.address}
        <p class="mt-2 text-sm text-red-600">{$errors.address}</p>
      {/if}
    </div>

    <div>
      <label for="alias" class="block text-sm font-medium text-gray-700 dark:text-gray-200">Alias</label>
      <input type="text" id="alias" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-800" bind:value={$form.alias} onchange={handleChange} />
      {#if $errors.alias}
        <p class="mt-2 text-sm text-red-600">{$errors.alias}</p>
      {/if}
    </div>

    <div>
      <label for="note" class="block text-sm font-medium medium text-gray-700 dark:text-gray-200">Note</label>
      <textarea id="note" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border:indigo-500 focus:ring-indigo-500 sm: text-sm text-gray-800" bind:value={$form.note} onchange={handleChange}></textarea>
      {#if $errors.note}
        <p class="mt-2 text-sm text-red-600">{$errors.note}</p>
      {/if}
    </div>

    <div class="pt-5">
      <div class="flex justify-end space-x-4">
        <button type="button" class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onclick={() => show = false}>Cancel</button>
        <button type="button" class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onclick={resetForm}>Reset</button>
        <button type="submit" class="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Save</button>
      </div>
    </div>
  </form>
</Modal>
