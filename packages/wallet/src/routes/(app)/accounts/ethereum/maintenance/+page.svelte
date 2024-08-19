<script lang="ts">
  import { getYakklAccounts, setYakklAccountsStorage, yakklAccountsStore, yakklPrimaryAccountsStore, getYakklPrimaryAccounts, setYakklPrimaryAccountsStorage, getYakklCurrentlySelected } from '$lib/common/stores';
  import { createForm } from 'svelte-forms-lib';
	import * as yup from 'yup';
  import { deepCopy, formatValue } from '$lib/utilities/utilities';
  import { onDestroy, onMount } from 'svelte';
  import { Dropdown, DropdownItem, Button, Helper } from 'flowbite-svelte';
  import * as Icon from 'flowbite-svelte-icons';
  import Back from '$lib/components/Back.svelte';
	import type { BigNumberish, YakklAccount, YakklCurrentlySelected, YakklPrimaryAccount } from '$lib/common';
	import WalletManager from '$lib/plugins/WalletManager';
	import type { Wallet } from '$lib/plugins/Wallet';
	import { dateString } from '$lib/common/datetime';
    
  let wallet: Wallet;

  let currentlySelected: YakklCurrentlySelected;

  let error = false;
  let errorValue = '';
  let dropdownOpen = false;
  let showConfirm = false;

  let name: string;
  let address: string;
  let accountType: string;
  let alias: string;
  let description: string;
  let value: BigNumberish;
  let index = -1; // Default - means only add

  let accounts: YakklAccount[] = [];
  let primaryAccounts: YakklPrimaryAccount[] = [];
  let subAccounts = [];

  let primaryAccount: YakklPrimaryAccount | undefined;
  let deleteButton: HTMLElement | null;
  
  onMount(async () => {
    handleClear();
    currentlySelected = await getYakklCurrentlySelected();

    wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
    accounts = await getYakklAccounts();
    if (!accounts) {
      accounts = [];
    }
    primaryAccounts = await getYakklPrimaryAccounts();
    if (!primaryAccounts) {
      primaryAccounts = [];
    }
    deleteButton = document.getElementById('delete');
    if (deleteButton) {
      (deleteButton as HTMLButtonElement).disabled = true;
    }
  });


  onDestroy(() => {
    handleClear();
  });

  
  const { form, errors, state, isValid, handleChange, handleSubmit } = createForm({
    initialValues: { name: '', alias: '', description: '' },
    validationSchema: yup.object().shape({
      name: yup
        .string() 
        .required('Please enter account name'),
      alias: yup
        .string()
        .optional(),
      description: yup
        .string()
        .optional()
    }),
    onSubmit: async (data) => {
    }
  });


  function handleClear() {
    if (deleteButton) (deleteButton as HTMLButtonElement).disabled = true;
    name = $form.name = '';
    address = '';
    alias = $form.alias = '';
    description = $form.description = '';
    accountType = '';
    value = 0n;
    subAccounts = [];
    index = -1;
  }
  

  async function handleClick(idx: number) {
    try {
      if (accounts) {
        index = idx;
        
        $form.name = name = accounts[index].name;
        $form.alias = alias = accounts[index].alias as string;
        $form.description = description = accounts[index].description; 
        address = accounts[index].address;
        (deleteButton as HTMLButtonElement).disabled = true;
        accountType = accounts[index].accountType;
        if (accountType === 'sub') {
          accountType = 'SUBPORTFOLIO';
          (deleteButton as HTMLButtonElement).disabled = false;
        } else {
          accountType = String(accountType).toUpperCase();
          subAccounts = [];
          primaryAccount = primaryAccounts.find(item => item.address === address);
          if (primaryAccount) {
            if (primaryAccount?.subAccounts?.length ?? 0 > 0) {
              subAccounts = deepCopy(primaryAccount.subAccounts);
            }
          }
          if (subAccounts.length === 0) {
            (deleteButton as HTMLButtonElement).disabled = false;
            }
        }

        try {
          const result = await wallet.getBalance(address);
          if (result)
            value = formatValue(currentlySelected.shortcuts.blockchain ?? 'Ethereum', result);
          
        } catch(e) {
          value = 0n;
        }

        if (value === undefined) {
          value = 0n;
        }
        dropdownOpen = false;
      }
    } catch(e) {
      errorValue = e as string;
      error = true;
    }
  }


  async function handleUpdate() {
    try {
      if (index >= 0) {        
        accounts[index].name = name = $form.name;
        accounts[index].alias = alias = $form.alias;
        accounts[index].description = description = $form.description;
        accounts[index].updateDate = dateString();

        await setYakklAccountsStorage(accounts);
        accounts = await getYakklAccounts(); // Force a refresh
        $yakklAccountsStore = accounts;

        // Check if accountType === 'primary' and if so, then update the primary list

        if (accountType === 'PRIMARY') {
          primaryAccount = primaryAccounts.find(item => item.address === address);
          if (primaryAccount) {
            primaryAccount.name = name;
            primaryAccount.updateDate = dateString();
            await setYakklPrimaryAccountsStorage(primaryAccounts);
            $yakklPrimaryAccountsStore = primaryAccounts = await getYakklPrimaryAccounts();
          }
        }

        handleClear();
      } else {
        errorValue = 'Update was called but there is not a valid index.';
        error = true;
      }
    } catch(e) {
      errorValue = e as string;
      error = true;
    }
  }


  async function handleDelete() {
    try {
      if ((deleteButton as HTMLButtonElement).disabled) {
        return;
      }

      if (index >= 0) {
        let deletedValue = accounts.splice(index,1);
        showConfirm = false;

        await setYakklAccountsStorage(accounts);
        if (accountType === 'PRIMARY') {
          primaryAccount = primaryAccounts.find(item => item.address === address);
          if (primaryAccount) {
            let _deletedPrimaryValue = primaryAccounts.splice(primaryAccounts.indexOf(primaryAccount),1);
          }
        }

        handleClear();
        accounts = await getYakklAccounts(); // Force a refresh
        primaryAccounts = await getYakklPrimaryAccounts(); // Force a refresh
        
        await setYakklAccountsStorage(accounts);
        await setYakklPrimaryAccountsStorage(primaryAccounts);

      } else {
        errorValue = 'Delete was called but there is not a valid index.';
        error = true;
      }
    } catch(e) {
      errorValue = e as string;
      error = true;
    }
  }


  function handleClose() {
    error = false;
  }

</script>

<div class="modal" class:modal-open={error}>
  <div class="modal-box relative">
    <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
    <h3 class="text-lg font-bold">ERROR!</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" on:click={handleClose}>Close</button>
    </div>
  </div>
</div>

<div class="modal" class:modal-open={showConfirm}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">Account Maintenance</h3>
    <p class="py-4">This will delete the account. Do you wish to continue?</p>
    <div class="modal-action">
      <button class="btn" on:click={handleDelete}>Yes</button>
      <button class="btn" on:click={()=>showConfirm = false}>Cancel</button>
    </div>
  </div>
</div>

<div class="text-center min-h-[75rem]">
  <div class="relative w-full h-9">
    <Back defaultClass="left-0 top-0 absolute" href=''/>
    <h2 class="text-xl tracking-tight font-extrabold text-base-content">
      <span class="lg:inline">Account Maintenance</span>
    </h2>
  </div>

  <hr class="mb-0.5 mt-0.5" />

  <div class="justify-center mb-4 mt-2">
    <Button>Account List<Icon.ChevronDoubleUpOutline class="w-3 h-3 ml-2 text-white dark:text-white" /></Button>
    <Dropdown class="overflow-y-auto px-3 pb-3 text-sm h-44" bind:open={dropdownOpen}>
      <div slot="header" class="p-3">
        Account List
      </div>
      {#each accounts as account, i}
      <DropdownItem on:click={() => handleClick(i)}>
        {account.name}
        <Helper class="pl-6">{account.address}</Helper>
      </DropdownItem>
      {/each}
    </Dropdown>
  </div>

  <form class="" on:submit|preventDefault={handleSubmit}>

    <div class="flex flex-row mt-2">
      <div class="flex-col w-full text-left">
        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Wallet Account Name:</span>
        <input
          id="name"
          class="input input-bordered input-primary w-full mb-2"
          placeholder="Account Name"
          autocomplete="off"
          bind:value={$form.name}
          on:change={handleChange}
          required />
        {#if $errors.name}
          <small class="text-red-600 font-bold animate-pulse">{$errors.name}</small>
        {/if}
      
        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Wallet Account Alias (optional):</span>
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

        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Description (optional):</span>
        <textarea
          id="description"
          rows="2"
          class="textarea textarea-primary mb-2 w-full"
          placeholder="Description"
          autocomplete="off"
          bind:value={$form.description}
          on:change={handleChange}/>
        {#if $errors.description}
          <small class="text-red-600 font-bold animate-pulse">{$errors.description}</small>
        {/if}

        <div class="divider">Below is read-only</div>

        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Balance:</span>
        <input
          id="balance"
          class="input input-bordered input-primary w-full mb-2"
          placeholder="Balance"
          autocomplete="off"
          value={value + ' ETH'}
          readonly />

        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Address:</span>
        <input
          id="address"
          class="input input-bordered input-primary w-full mb-2"
          placeholder="Address"
          autocomplete="off"
          value={address}
          readonly />

        <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Wallet Account Type:</span>
        <input
          id="accountType"
          class="input input-bordered input-primary w-full mb-2"
          placeholder="Account Type"
          autocomplete="off"
          value={accountType}
          readonly />
  
          <span class="mt-2 text-left text-xs text-base-content font-bold mb-1">Number of Subportfolio Wallet Accounts:</span>
          <input
            id="subAccounts"
            class="input input-bordered input-primary w-full mb-2"
            placeholder="Subportfolio Accounts"
            autocomplete="off"
            value={subAccounts.length}
            readonly />

        </div>
    </div>

    <div class="mt-4 flex flex-row justify-center">

      <!-- Don't confirm on update since the user can change it again but we may want to later -->
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
        id="delete"
        on:click|preventDefault={() => showConfirm = true}
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
