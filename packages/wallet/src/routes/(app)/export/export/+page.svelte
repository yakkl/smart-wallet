<script lang="ts">
  import { browser as browserSvelte } from '$app/environment';
  import { goto } from '$app/navigation';
  import { truncate, timeoutClipboard } from '$lib/utilities/utilities';
  import ClipboardJS from 'clipboard';
  import { PATH_EXPORT } from '$lib/common/constants';
  import { getYakklCurrentlySelected, yakklMiscStore } from '$lib/common/stores';
  import Back from '$lib/components/Back.svelte';
  import { onMount } from 'svelte';
  import { decryptData } from '$lib/common/encryption';
	import { isEncryptedData, type AccountData, type CurrentlySelectedData, type YakklCurrentlySelected } from '$lib/common';
	import { verify } from '$lib/common/secuirty';
  // import * as Sentry from "@sentry/svelte";

  let error = false;
  let errorValue: any;

  // TBD - add additional button if yes/no and button listeners that do something

  let clipboard;
  let pkey = '';
  let name: string;
  let address: string;
  let userName: string;
  let pwd: string;
  let btnCopy: HTMLButtonElement;
  let currentlySelected: YakklCurrentlySelected;

  onMount(async () => {
    if (browserSvelte) {
      try {
        currentlySelected = await getYakklCurrentlySelected();

        btnCopy = document.getElementById('btnCopy') as HTMLButtonElement;
        const uName: HTMLElement = document.getElementById('userName') as HTMLElement;
        const pwd: HTMLElement = document.getElementById('password') as HTMLElement;
        const wrapper: HTMLElement = document.getElementById('wrapperExport') as HTMLElement;

        wrapper.oncontextmenu = handleDisable;

        uName.oncopy = handleDisable;
        uName.onpaste = handleDisable;
        pwd.oncopy = handleDisable;
        pwd.onpaste = handleDisable;
        uName.oncontextmenu = handleDisable;
        pwd.oncontextmenu = handleDisable;
        uName.ondrag = handleDisable;
        uName.ondrop = handleDisable;
        pwd.ondrag = handleDisable;
        pwd.ondrop = handleDisable;

        clipboard = new ClipboardJS('.clip');
        clipboard.on('success', function(e) {
          e.clearSelection();
          if (!btnCopy) {
            btnCopy = document.getElementById('btnCopy') as HTMLButtonElement;
          }
          btnCopy.disabled = true;
          pkey = 'Copied...';
          
          timeoutClipboard(20);
        });

        name = truncate(currentlySelected.shortcuts.accountName, 20);
        address = currentlySelected.shortcuts.address;

      } catch(e) {
        console.log(e);
      }
    }
  });
  
  
  async function exportAddress() {
    try {
      if (!userName || !pwd) {
        pkey = '';
        return;
      }

      let profile = await verify(userName.toLowerCase().trim().replace('.nfs.id', '')+'.nfs.id'+pwd);

      if (!profile) {
        throw 'Username and/or password is not correct';
      }

      let account;

      if (isEncryptedData(currentlySelected.data)) {
        await decryptData(currentlySelected.data, $yakklMiscStore).then(result => {
          currentlySelected.data = result as CurrentlySelectedData;
        });
      }
      account = (currentlySelected.data as CurrentlySelectedData).account;

      if (isEncryptedData(account.data)) {
        await decryptData(account.data, $yakklMiscStore).then(result => {
          account.data = result as AccountData;
        });
      }

      pkey = (account.data as AccountData).privateKey;
      profile = undefined;

      userName = '';
      pwd = '';

      if (!btnCopy) {
        btnCopy = document.getElementById('btnCopy') as HTMLButtonElement;
      }
      btnCopy.disabled = false; //readonly = false; // TODO: Check this out!!
      
      // TBD - Set a timer for 30 seconds and then fade out pkey data and put something like 'Data expired'

      // digestMessage(pwd).then(result => {
      //     if ($yakklMiscStore === result) {
      //         let profile;
      //         getProfile().then(result => {
      //             profile = result;
      //             decryptData(profile, $yakklMiscStore).then(result => {
      //                 profile = result;
      //                 let account = profile.accounts.find(account => account.name === currentlySelected.account.name);
      //                 pkey = account.privateKey;
      //                 profile = undefined;
      //             });
      //         });
      //     }
      // });
    } catch (e) {
      // Sentry.captureException(e);
      errorValue = e;
      error = true;
    }
  }

  function handleDisable() {
    return false;
  }
</script>

  
<div class="modal" class:modal-open={error}>
  <div class="modal-box relative">
    <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
    <h3 class="text-lg font-bold">ERROR</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" on:click={() => error = false}>Close</button>
    </div>
  </div>
</div>
<!-- TBD - May want to export to an encrypted file and bypass info below -->

<div id="wrapperExport" class="flex flex-col relative justify-center bg-base-100 px-4">
  <Back defaultClass="-left-3 -top-3"/>

  <div class="flex flex-col items-center">
    <span class="w-full px-1 text-xl font-extrabold border-none text-base-content text-center">Export Wallet Account</span>
    <input 
      type="text" 
      class="w-full px-1 text-xs input input-primary"
      id="address"
      value="{address}"
      readonly
    />
    <span class="w-full text-xs text-base-content text-left mb-1"><span class="font-bold">{name}</span> - Address</span>
  </div>

  <hr class="mb-3"/>

  <p class="w-full p-2 text-small border-2 border-red-200 bg-red-50 text-red-900 rounded drop-shadow-lg" aria-label="Private Key warning">
    Please be careful! <strong>Your PRIVATE KEY should remain PRIVATE</strong>. 
    A bad actor could take the content of your wallet if they have access to the PRIVATE KEY! Copy the PRIVATE KEY (once it's shown below) and store it somewhere safe!!
  </p>

  <div class="pt-1 item-center w-full text-base-content">
    <span class="text-md font-bold text-left mt-2">YAKKL Username:</span>
    <!-- px-3 md:py-2 py-1 text-lg font-normal text-gray-700 bg-gray-100  border border-solid border-gray-300 transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none -->
    <input id="userName"
      class="input input-bordered input-primary w-full mt-2 "
      placeholder="Username" autocomplete="off" bind:value="{userName}" aria-label="Username" required />

    <span class="text-md font-bold text-left mt-2 mb-1">YAKKL Password:</span>
    <!-- md:py-2 py-1 text-lg font-normal text-gray-700 bg-gray-100  border border-solid border-gray-300 transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none -->
    <input id="password" type="password"
      class="input input-bordered input-primary w-full mt-2 "
      placeholder="Password" autocomplete="off" bind:value="{pwd}" aria-label="Enter password" required />

    <span class="text-md font-bold text-left mt-2 mb-1">DANGER - Private Key:</span>
    <button id="btnCopy" class="clip w-4" data-clipboard-action="copy" data-clipboard-target="#pkey2" data-bs-toggle="tooltip" data-bs-placement="top" title="Securely Copy Private Key!">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>        
    </button>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="break-all p-1 text-md print:hidden font-mono w-full h-12 border-2 border-red-200 text-red-900 bg-red-50"
      id="pkeytext"
      on:mousedown={() => {return false}}
      on:selectstart={() => {return false}}
      on:copy={() => {return false}}
      on:cut={() => {return false}}
      on:paste={() => {return false}}
      on:contextmenu={() => {return false}}>
      {pkey}
    </div>
    <input id="pkey2" name="pkey" value=":yakkl:{pkey}" type="hidden">    
  </div>
  <div class="mt-5 mb-1">
    <div class="flex justify-center">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <button on:click={() => goto(PATH_EXPORT)} 
        type="button"
        aria-label="Cancel"
        class="btn-sm btn-accent uppercase rounded-full">
        Cancel
      </button>
      <button 
        type="button" 
        on:click={exportAddress} 
        class="btn-sm btn-primary uppercase rounded-full ml-2"
        aria-label="Confirm">
        Confirm
      </button>
    </div>
  </div>   
</div>



