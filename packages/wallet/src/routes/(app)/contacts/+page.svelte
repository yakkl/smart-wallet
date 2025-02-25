<!-- @migration-task Error while migrating Svelte code: can't migrate `let error = false;` to `$state` because there's a variable named state.
     Rename the variable and try again or migrate by hand. -->
<script lang="ts">
  import { getYakklContacts, setYakklContactsStorage, yakklMiscStore, getYakklCurrentlySelected } from '$lib/common/stores';
  import { createForm } from 'svelte-forms-lib';
  import * as yup from 'yup';
  import { dateString } from '$lib/common/datetime';
  import { onDestroy, onMount } from 'svelte';
  import { decryptAndSetData } from '$lib/common/gets';
  import { setDefinedProperty } from '$lib/common/gets';
  import { Dropdown, DropdownItem, Button, Helper } from 'flowbite-svelte';
  // import * as Icon from 'flowbite-svelte-icons';
  // import ChevronDoubleUpOutline from '$lib/components/ChevronDoubleUpOutline.svelte.tmp';
  import Back from '$lib/components/Back.svelte';
  import type { YakklContact, YakklCurrentlySelected } from '$lib/common';
  import WalletManager from '$lib/plugins/WalletManager';
  import type { Wallet } from '$lib/plugins/Wallet';
  import { isEthereum } from '$lib/plugins/BlockchainGuards';

  let wallet: Wallet;

  let currentlySelected: YakklCurrentlySelected;

  let error = false;
  let errorValue = '';
  let dropdownOpen = false;
  let name: string;
  let address: string;
  let alias: string;
  let note: string;
  let index = -1; // Default - means only add
  let contacts: YakklContact[] = [];

  onMount(async () => {
    handleClear();
    currentlySelected = await getYakklCurrentlySelected();
    wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
    contacts = await getYakklContacts();
    if (!contacts) {
      contacts = [];
    }
  });

  onDestroy(() => {
    handleClear();
  });

  const { form, errors, state, isValid, handleChange, handleSubmit } = createForm({
    initialValues: { name: '', address: '', alias: '', note: '' },
    validationSchema: yup.object().shape({
      name: yup.string().required('Please enter contact name'),

      // TODO: This needs a function based on the blockchain to validate the address
      address: yup.string().required('Please enter the crypto address of this contact')
        .matches(/^(0x)?[0-9a-fA-F]{40}$|^.*\.eth$/, 'Must be a valid address or ENS name'),

      alias: yup.string().optional(),
      note: yup.string().optional()
    }),
    onSubmit: async (data) => {
      try {
        if (await verifyContact(data.name, data.address, data.alias, data.note)) {
          processContact();  // Accept the defaults for now
        } else {
          errorValue = 'Unable to verify contact before processing.';
          error = true;
        }
      } catch (e) {
        error = true;
        errorValue = e as string;
        console.log(e);
      }
    }
  });

  async function verifyContact(fname: string, faddress: string, falias: string, fnote: string) {
    name = fname;
    address = faddress;
    alias = falias;
    note = fnote;

    let resolvedAddr = null;
    const blockchain = wallet.getBlockchain();

    if (isEthereum(blockchain)) {
      resolvedAddr = await blockchain.resolveName(alias);
    }

    if (resolvedAddr) {
      address = resolvedAddr;
    }

    if (!blockchain.isAddress(address)) {
      errorValue = `Address ${address} is not a valid address. A valid toAddress is required.`;
      error = true;
      return false;
    }

    return true;
  }

  function handleClear() {
    name = $form.name = '';
    address = $form.address = '';
    alias = $form.alias = '';
    note = $form.note = '';
  }

  function handleClick(idx: number) {
    if (contacts) {
      index = idx;
      $form.name = contacts[index].name;
      $form.address = contacts[index].address;
      $form.alias = contacts[index].alias === undefined ? '' : contacts[index].alias as string;
      $form.note = contacts[index].note === undefined ? '' : contacts[index].note as string;

      dropdownOpen = false;
    }
  }

  async function handleUpdate() {
    try {
      if (index >= 0) {
        if (await verifyContact($form.name, $form.address, $form.alias, $form.note)) {
          contacts[index].name = name;
          contacts[index].address = address;
          contacts[index].alias = alias;
          contacts[index].note = note;
          contacts[index].updateDate = dateString();

          await setYakklContactsStorage(contacts);

          handleClear();
        } else {
          errorValue = 'Unable to update contact.';
          error = true;
        }
      } else {
        errorValue = 'Update was called but there is not a valid index.';
        error = true;
      }
    } catch (e) {
      errorValue = e as string;
      error = true;
    }
  }

  async function handleDelete() {
    try {
      if (index >= 0) {
        contacts.splice(index, 1);

        await setYakklContactsStorage(contacts);

        handleClear();
      } else {
        errorValue = 'Delete was called but there is not a valid index.';
        error = true;
      }
    } catch (e) {
      errorValue = e as string;
      error = true;
    }
  }

  function handleClose() {
    error = false;
  }

  async function processContact() {
    try {
      let duplicate = false;
      if (contacts) {
        if (contacts.find(element => element.name === name) !== undefined) duplicate = true;
      } else {
        contacts = []; // fallback
      }

      if (duplicate) {
        errorValue = 'Unable to ADD due to name already registered.';
        error = true;
        return;
      }

      let contact: YakklContact = {
        id: currentlySelected.id.toString(),
        name: name,
        address: address,
        alias: alias,
        note: note,
        addressType: 'EOA',
        blockchain: currentlySelected.shortcuts.blockchain as string,
        version: currentlySelected.version,
        createDate: dateString(),
        updateDate: dateString(),
      };

      await decryptAndSetData(contact, $yakklMiscStore);

      setDefinedProperty(contact, 'alias', alias);
      setDefinedProperty(contact, 'note', note);

      contacts.push(contact);
      await setYakklContactsStorage(contacts);

      handleClear();
    } catch (e) {
      errorValue = e as string;
      console.log(e);
      error = true;
    }
  }

</script>

<div class="modal" class:modal-open={error}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">ERROR!</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" on:click={handleClose}>Close</button>
    </div>
  </div>
</div>

<div class="text-center min-h-[75rem]">
  <div class="relative w-full h-9">
    <Back defaultClass="left-0 top-0 absolute" href=''/>
    <h2 class="text-xl tracking-tight font-extrabold text-base-content">
      <span class="lg:inline">Contact</span>
    </h2>
  </div>

  <hr class="mb-0.5 mt-0.5" />

  <div class="justify-center mb-4 mt-2">
    <Button>Contact List </Button><!--<ChevronDoubleUpOutline name="chevron-down-solid" class="w-3 h-3 ml-2 text-white dark:text-white" /></Button> -->
    <Dropdown class="overflow-y-auto px-3 pb-3 text-sm h-44" bind:open={dropdownOpen}>
      <div slot="header" class="p-3">
        Contact List
      </div>
      {#each contacts as contact, i}
      <DropdownItem on:click={() => handleClick(i)}>
        {contact.name}
        <small class="text-xs text-gray-500">{contact.address}</small>
      </DropdownItem>
      {/each}
    </Dropdown>
  </div>

  <form on:submit|preventDefault={handleSubmit}>
    <div class="flex justify-center">
      <div class="w-full max-w-xs">
        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Name:</span>
        <input
          id="name"
          class="input input-bordered input-primary w-full mb-2"
          placeholder="Name"
          autocomplete="off"
          bind:value={$form.name}
          on:change={handleChange}
          required />
        {#if $errors.name}
          <small class="text-red-600 font-bold animate-pulse">{$errors.name}</small>
        {/if}

        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Crypto Address:</span>
        <input
          id="address"
          class="input input-bordered input-primary w-full mb-2"
          placeholder="Crypto address"
          autocomplete="off"
          bind:value={$form.address}
          on:change={handleChange}
          required />
        {#if $errors.address}
          <small class="text-red-600 font-bold animate-pulse">{$errors.address}</small>
        {/if}

        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Alias (optional):</span>
        <input
          id="alias"
          class="input input-bordered input-primary w-full mb-2"
          placeholder="Alias"
          autocomplete="off"
          bind:value={$form.alias}
          on:change={handleChange}/>
        {#if $errors.alias}
          <small class="text-red-600 font-bold animate-pulse">{$errors.alias}</small>
        {/if}

        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Note (optional):</span>
        <textarea
          id="note"
          rows="2"
          class="textarea textarea-primary mb-2 w-full"
          placeholder="Note"
          autocomplete="off"
          bind:value={$form.note}
          on:change={handleChange}></textarea>
        {#if $errors.note}
          <small class="text-red-600 font-bold animate-pulse">{$errors.note}</small>
        {/if}
      </div>
    </div>

    <div class="mt-4 flex flex-row justify-center">
      <button
        class="flex flex-row btn btn-primary rounded-full"
        data-mdb-ripple="true"
        data-mdb-ripple-color="light">
        <div class="items-center align-middle">
          <span>+ADD</span>
        </div>
      </button>

      <button
        on:click|preventDefault={() => handleUpdate()}
        class="ml-4 flex flex-row btn btn-primary rounded-full"
        data-mdb-ripple="true"
        data-mdb-ripple-color="light">
        <div class="inline-flex items-center align-middle">
          <span>Update</span>
        </div>
      </button>

      <button
        on:click|preventDefault={() => handleDelete()}
        class="ml-4 flex flex-row btn btn-primary rounded-full"
        data-mdb-ripple="true"
        data-mdb-ripple-color="light">
        <div class="inline-flex items-center align-middle">
          <span>Delete</span>
        </div>
      </button>
    </div>
    <div class="mt-4 flex flex-row justify-center">
      <button
        on:click|preventDefault={handleClear}
        class="flex flex-row w-[150px] btn btn-primary rounded-full"
        data-mdb-ripple="true"
        data-mdb-ripple-color="light">
        <div class="items-center align-middle">
          <span class="text-center block w-[90px]">Clear</span>
        </div>
      </button>
    </div>
  </form>
</div>
