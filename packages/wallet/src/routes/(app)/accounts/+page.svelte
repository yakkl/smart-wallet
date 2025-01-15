<script lang="ts">
  import { browserSvelte } from '$lib/utilities/browserSvelte';
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { PATH_ACCOUNTS_ETHEREUM_CREATE_DERIVED, PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY, PATH_IMPORT_PRIVATEKEY, PATH_EXPORT, PATH_IMPORT_WATCH, YAKKL_ZERO_ADDRESS, PATH_ACCOUNT_MAINTENANCE, PATH_LOCK } from "$lib/common/constants";
  import { getYakklCurrentlySelected } from '$lib/common/stores';
  import ErrorNoAction from "$lib/components/ErrorNoAction.svelte";
  import Back from "$lib/components/Back.svelte";
	import ButtonGrid from "$lib/components/ButtonGrid.svelte";
  import ButtonGridItem from "$lib/components/ButtonGridItem.svelte";
  import { handleOnMessage } from '$lib/common/handlers';

  import { getBrowserExt } from '$lib/browser-polyfill-wrapper';
	import type { Browser } from 'webextension-polyfill';
	import { routeCheckWithSettings } from '$lib/common/routes';
	import type { YakklAccount, YakklCurrentlySelected, YakklWatch } from '$lib/common';
	import ImportWatchAccount from '$lib/components/ImportWatchAccount.svelte';
	import ImportPrivateKey from '$lib/components/ImportPrivateKey.svelte';
	import type { Yakkl } from '$lib/plugins/providers';
	import ExportPrivateKey from '$lib/components/ExportPrivateKey.svelte';
	import Accounts from '$lib/components/Accounts.svelte';
  let browser_ext: Browser;
  if (browserSvelte) browser_ext = getBrowserExt();

  let error = $state(false);
  let errorValue: string = $state();
  let isPortfolioModalOpen = $state(false);
  let isSubPortfolioModalOpen = $state(false);
  let showImportWatch = $state(false);
  let showImportAccount = $state(false);
  let showExportPrivateKey = $state(false);
  let showAccounts = $state(false);

  let currentlySelected: YakklCurrentlySelected;

  onMount(async () => {
    try {
      if (browserSvelte) {
        currentlySelected = await getYakklCurrentlySelected();
        browser_ext.runtime.onMessage.addListener(handleOnMessage);
      }
    } catch (e) {
      console.log(e);
    }
  });

  onDestroy(() => {
    try {
      if (browserSvelte) {
        browser_ext.runtime.onMessage.removeListener(handleOnMessage);
      }
    } catch (e) {
      console.log(e);
    }
  });

  routeCheckWithSettings();

  function handleAccounts(e: any) {
    if (browserSvelte) {
      isPortfolioModalOpen = false;
      goto(PATH_ACCOUNTS_ETHEREUM_CREATE_PRIMARY);
    }
  }

  function handleSubAccounts(e: any) {
    if (browserSvelte) {
      isSubPortfolioModalOpen = false;
      if (currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS) {
        errorValue = 'NO WALLET ACCOUNT has been created yet. Please create a portfolio wallet account first.';
        error = true;
      } else {
        if (currentlySelected.shortcuts.accountType !== 'imported') {
          goto(PATH_ACCOUNTS_ETHEREUM_CREATE_DERIVED);
        } else {
          errorValue = 'The currently selected Wallet Account is an imported account. To create a secondary account (an account attached to a primary account) you must first select a non-imported account. Click or hover over the circle with 3 dots (•••) on the card, then select "List" option, and then select a primary or secondary account from the popup list.';
          error = true;
        }
      }
    }
  }

  // function handleExport() {
  //   if (browserSvelte) {
  //     if (currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS) {
  //       errorValue = 'NO WALLET ACCOUNT has been created yet. Please create a portfolio wallet account first.';
  //       error = true;
  //     } else {
  //       goto(PATH_EXPORT);
  //     }
  //   }
  // }


  // function handleAccountMaintenance() {
  //   if (browserSvelte) {
  //     if (currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS) {
  //       errorValue = 'NO ACCOUNT has been created yet. Please create a portfolio account first.';
  //       error = true;
  //     } else {
  //       goto(PATH_ACCOUNT_MAINTENANCE);
  //     }
  //   }
  // }

  function handleImport(account: YakklAccount) {
    if (browserSvelte) {
      showImportAccount = true;
    }
  }

  function handleImportWatch(account: YakklWatch) {
    if (browserSvelte) {
      showImportWatch = true;
    }
  }

  function handleExportPrivateKey() {
    if (browserSvelte) {
      showExportPrivateKey = true;
    }
  }

  function handleAccountMaintenance(account: YakklAccount) {
    if (browserSvelte) {
      showAccounts = true;
    }
  }

</script>

<ErrorNoAction bind:show={error} value={errorValue} title="ERROR"/>

<Back defaultClass="left-3 top-[.8rem] absolute" href='' />

<div class="text-center text-base-content">
  <div class="bg-secondary absolute top-[0.1rem] left-[.1rem] rounded-tl-xl rounded-tr-xl w-[99%] h-2"></div>
  <h1 class="text-xl tracking-tight font-extrabold">
    <span class="2xl:inline">Wallet Accounts</span>
  </h1>
  <br>
</div>

<ImportWatchAccount bind:show={showImportWatch} onComplete={handleImportWatch} className="text-gray-600 z-[999]"/>

<ImportPrivateKey bind:show={showImportAccount} onComplete={handleImport} className="text-gray-600 z-[999]"/>

<ExportPrivateKey bind:show={showExportPrivateKey} onVerify={handleExportPrivateKey} className="text-gray-600 z-[999]"/>

<Accounts bind:show={showAccounts} onAccountSelect={handleAccountMaintenance} className="text-gray-600"/>

<ButtonGrid>

  <ButtonGridItem handle={() => showAccounts=true} title="Maintenance" btn="btn-secondary" >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class=" flex flex-col w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  </ButtonGridItem>

  <ButtonGridItem handle={() => isPortfolioModalOpen=true} title="Add Portfolio Wallet" btn="btn-secondary" >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="flex flex-col w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  </ButtonGridItem>

  <!-- Modal for portfolio -->
  <div class="modal" class:modal-open={isPortfolioModalOpen}>
    <div class="modal-box relative">
      <h3 class="text-lg font-bold">Portfolio Wallet Account Creation</h3>
      <p class="py-4">This will create a portfolio level wallet account. Do you wish to continue?</p>
      <div class="modal-action">
        <button class="btn" onclick={handleAccounts}>Yes</button>
        <button class="btn" onclick={()=>isPortfolioModalOpen = false}>Cancel</button>
      </div>
    </div>
  </div>

  <ButtonGridItem handle={() => isSubPortfolioModalOpen=true} title="Add Subportfolio Wallet" btn="btn-secondary" >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  </ButtonGridItem>

  <!-- Modal for Subportfolio -->
  <div class="modal" class:modal-open={isSubPortfolioModalOpen}>
    <div class="modal-box relative">
      <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
      <h3 class="text-lg font-bold">Subportfolio Wallet Account Creation</h3>
      <p class="py-4">This will create a subportfolio level wallet account. Do you wish to continue?</p>
      <div class="modal-action">
        <button class="btn" onclick={handleSubAccounts}>Yes</button>
        <button class="btn" onclick={()=>isSubPortfolioModalOpen = false}>Cancel</button>
      </div>
    </div>
  </div>

  <ButtonGridItem handle={() => showImportWatch=true} title="Add Watch-Only Wallet" btn="btn-secondary" >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </ButtonGridItem>

  <!-- All Contacts were moved to the Speed dial area -->
  <!-- <ButtonGridItem handle={() => goto(PATH_CONTACTS)} title="Contacts" btn="btn-secondary" >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  </ButtonGridItem> -->

  <ButtonGridItem handle={() => showImportAccount=true} title="Import Wallet" btn="btn-secondary" >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  </ButtonGridItem>

  <ButtonGridItem handle={() => showExportPrivateKey=true} title="Export Wallet" btn="btn-secondary" >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 m-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  </ButtonGridItem>

    <!-- TEST -->
    <!-- <div class="rounded-md shadow h-24"> -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_interactive_supports_focus -->
      <!-- <div role="button" on:click={() => goto('/dapp/popups/approve.html')}
        class="btn btn-secondary w-full h-full flex flex-col items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <span class="text-sm mt-2 text-center">Test dApp Popup</span>
      </div> -->
    <!-- </div> -->

</ButtonGrid>
