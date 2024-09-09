<!-- AccountListing.svelte -->
<script lang="ts">
  import type { YakklAccount } from '$lib/common';
  import { onMount } from 'svelte';
  import { yakklAccountsStore, yakklPrimaryAccountsStore, yakklCurrentlySelectedStore } from '$lib/common/stores';
  import AccountForm from './AccountForm.svelte';
  import Confirmation from './Confirmation.svelte';
  import { dateString } from '$lib/common/datetime';
  import { setYakklAccountsStorage, setYakklPrimaryAccountsStorage } from '$lib/common/stores';
  import { AccountTypeCategory } from '$lib/common/types';
  import EditControls from './EditControls.svelte';
	import { deepCopy } from '$lib/utilities/utilities';

  export let accounts: YakklAccount[] = [];
  export let onAccountSelect: (account: YakklAccount) => void = () => {};

  let editMode = false;
  let showDeleteModal = false;
  let selectedAccount: YakklAccount | null = null;

  onMount(() => {
    accounts = $yakklAccountsStore;
  });

  function handleEdit(account: YakklAccount) {
    selectedAccount = account;
    editMode = true;
  }

  function handleDelete(account: YakklAccount) {
    selectedAccount = account;
    showDeleteModal = true;
  }

  function confirmDelete() {
    if (selectedAccount) {
      console.log('Deleting account:', selectedAccount);
      console.log('Accounts 1:', deepCopy(accounts));
      
      if (selectedAccount.accountType === AccountTypeCategory.PRIMARY) {
        let subAccounts = accounts.filter(a => a.primaryAccount?.address === selectedAccount!.address);
        console.log('Sub accounts:', subAccounts);
        subAccounts.forEach(subAccount => {
          const index = accounts.findIndex(a => a.address === subAccount.address);
          if (index !== -1) {
            console.log('Deleting sub account:', accounts[index]);
            accounts.splice(index, 1);
          }
        });
      }
      accounts = accounts.filter(a => a.address !== selectedAccount!.address);
      setYakklAccountsStorage(accounts);
      console.log('Accounts 2:', deepCopy(accounts));

      $yakklAccountsStore = accounts;
      
      if (selectedAccount.accountType === AccountTypeCategory.PRIMARY) {
        let primaryAccounts = $yakklPrimaryAccountsStore.filter(a => a.address !== selectedAccount!.address);
        setYakklPrimaryAccountsStorage(primaryAccounts);
      }

      console.log('Accounts 3:', accounts);
      console.log('Accounts 4:', $yakklAccountsStore);

      showDeleteModal = false;
      selectedAccount = null;
    }
  }

  function updateAccount(updatedAccount: YakklAccount) {
    console.log('Updating account:', updatedAccount);

    const index = accounts.findIndex(a => a.address === updatedAccount.address);
    if (index !== -1) {
      console.log('Updating account at index:', index);
      console.log('Accounts1:', deepCopy(accounts));
      console.log('Account[]1:', deepCopy(accounts[index]));

      accounts[index] = { ...updatedAccount, updateDate: dateString() };
      console.log('Accounts2:', deepCopy(accounts));
      console.log('Account[]2:', deepCopy(accounts[index]));

      if (updatedAccount.accountType === AccountTypeCategory.PRIMARY) {
        updatePrimaryAndSubAccounts(updatedAccount);
      }
      setYakklAccountsStorage(accounts);
      $yakklAccountsStore = accounts;
      selectedAccount = updatedAccount;
    }
    editMode = false;
  }

  function updatePrimaryAndSubAccounts(updatedPrimaryAccount: YakklAccount) {
    let primaryAccount = $yakklPrimaryAccountsStore.find(a => a.address === updatedPrimaryAccount.address);
    if (primaryAccount) {
      primaryAccount.name = updatedPrimaryAccount.name;
      primaryAccount.updateDate = dateString();
      setYakklPrimaryAccountsStorage($yakklPrimaryAccountsStore);
    }
    let subAccounts = accounts.filter(a => a.primaryAccount?.address === updatedPrimaryAccount.address);
    console.log('Sub accounts:', subAccounts);
    subAccounts.forEach(subAccount => {
      const index = accounts.findIndex(a => a.address === subAccount.address);
      if (index !== -1) {
        accounts[index].primaryAccount!.name = updatedPrimaryAccount.name;
        accounts[index].primaryAccount!.updateDate = dateString();
      }
    });
  }

  function handleCopy(account: YakklAccount) {
    navigator.clipboard.writeText(account.address);
  }
</script>

<ul>
  {#each accounts as account}
    <li class="mb-4 relative">
      <button class="w-full flex items-start rounded-lg p-4 transition-colors duration-200 {account.accountType === AccountTypeCategory.PRIMARY ? 'bg-purple-100 hover:bg-purple-200' : account.accountType === AccountTypeCategory.SUB ? 'bg-blue-100 hover:bg-blue-200' : 'bg-green-100 hover:bg-green-200'}" on:click={() => onAccountSelect(account)}>
        <div class="w-8 h-8 flex items-center justify-center rounded-full {account.accountType === AccountTypeCategory.PRIMARY ? 'bg-purple-500' : account.accountType === AccountTypeCategory.SUB ? 'bg-blue-500' : 'bg-green-500'} text-white mr-4 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-md font-bold">{account.accountType === AccountTypeCategory.PRIMARY ? 'PORTFOLIO' : account.accountType === AccountTypeCategory.SUB ? 'SUB-PORTFOLIO' : 'IMPORTED'}</h3>
          </div>
          <p class="text-sm font-medium text-gray-600">{account.name}</p>
          {#if account.accountType === AccountTypeCategory.SUB}
          <span class="text-xs text-gray-500 mt-1">Derived from {account.primaryAccount?.name}</span>
          {/if}
          <p class="text-xs text-gray-500 mt-1">{account.address}</p>
        </div>
      </button>
      <EditControls onEdit={() => handleEdit(account)} onDelete={() => handleDelete(account)} onCopy={() => handleCopy(account)} controls={['copy', 'edit', 'delete']}/>
    </li>
  {/each}
</ul>

<AccountForm
  bind:show={editMode}
  bind:account={selectedAccount}
  onSubmit={updateAccount}
/>

<Confirmation
  bind:show={showDeleteModal}
  onConfirm={confirmDelete}
  title="Delete Account"
  message="Are you sure you want to delete this account? This action cannot be undone! If this is a primary account, all sub-accounts will also be deleted!"
/>

