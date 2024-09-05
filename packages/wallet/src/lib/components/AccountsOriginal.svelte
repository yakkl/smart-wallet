<script lang="ts">
  import { AccountTypeCategory } from '$lib/common/types';
  import { yakklAccountsStore, yakklCurrentlySelectedStore } from '$lib/common/stores';
  import { YAKKL_ZERO_ADDRESS } from '$lib/common/constants';
  import type { YakklAccount } from '$lib/common';
  import { onMount } from 'svelte';

  export let account: YakklAccount | null = null;
  export let show: boolean = false;

  let accountDialog: HTMLDialogElement | null = null;
  let error = '';

  $: {
    if (show) {
      accountDialog?.showModal();
    } else {
      accountDialog?.close();
    }
  }

  onMount(async () => {
    try {
      accountDialog = document.getElementById('accountDialog') as HTMLDialogElement;      
    } catch(e) {
      error = 'Error loading accounts. ' + e;
      console.log(e);
    }
  });

  function handleAccount(yakkl_account: YakklAccount | null) {
    account = yakkl_account;
    show = false;
  }

</script>

<dialog id="accountDialog">
  <div class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black opacity-50"></div>
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto z-10 h-[80%] flex flex-col">
      <div class="p-6 relative">
        <button class="absolute top-4 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700 focus:outline-none" on:click={() => show=false}>
          &times;
        </button>
        <h2 class="text-2xl font-bold mb-4">Account List</h2>
        <p class="text-sm text-gray-500 mb-4">Select the account you wish to make current</p>
      </div>
      <div class="flex-1 overflow-y-auto">
        <ul>
          {#each $yakklAccountsStore as item}
            <li class="mb-4">
              <button class="w-full flex items-start rounded-lg p-4 transition-colors duration-200 {item.accountType === AccountTypeCategory.PRIMARY ? 'bg-purple-100 hover:bg-purple-200' : item.accountType === AccountTypeCategory.SUB ? 'bg-blue-100 hover:bg-blue-200' : 'bg-green-100 hover:bg-green-200'}" on:click={() => handleAccount(item)}>
                <div class="w-8 h-8 flex items-center justify-center rounded-full {item.accountType === AccountTypeCategory.PRIMARY ? 'bg-purple-500' : item.accountType === AccountTypeCategory.SUB ? 'bg-blue-500' : 'bg-green-500'} text-white mr-4 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-bold">{item.accountType === AccountTypeCategory.PRIMARY ? 'PORTFOLIO' : item.accountType === AccountTypeCategory.SUB ? 'SUB-PORTFOLIO' : 'IMPORTED'}</h3>
                    {#if item.accountType === AccountTypeCategory.SUB}
                      <span class="text-sm text-gray-500 ml-2">Derived from Portfolio</span>
                    {/if}
                  </div>
                  <p class="text-sm font-medium text-gray-600">{item.name}</p>
                  <p class="text-xs text-gray-500 mt-2">{item.address}</p>
                </div>
              </button>
            </li>
          {/each}
          {#if $yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.address === YAKKL_ZERO_ADDRESS}
            <li>
              <p class="text-lg font-bold text-red-500">There are no Portfolio Accounts to display! Create at least one Portfolio account!</p>
            </li>
          {/if}
        </ul>
      </div>
      <div class="bg-gray-50 px-6 py-4 rounded-b-lg">
        <p class="text-sm text-gray-500">Whatever account you select will become your <span class="font-bold underline">active</span> account!</p>
      </div>
    </div>
  </div>
</dialog>
