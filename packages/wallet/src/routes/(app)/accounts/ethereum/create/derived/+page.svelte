<script lang="ts">
  // For Derived Accounts
  import { browser as browserSvelte } from '$app/environment';
  import { Button, Modal, Spinner } from 'flowbite-svelte';
  import { getProfile, getYakklCurrentlySelected, getSettings, getMiscStore } from '$lib/common/stores';
  import { decryptData, type Profile, isEncryptedData, type ProfileData, type YakklRegisteredData, type CurrentlySelectedData, type AccountData, type PrimaryAccountData, type YakklPrimaryAccount, type YakklAccount, type EmergencyKitAccountData, type YakklCurrentlySelected, type Settings } from '$lib/common';
  import { DEFAULT_DERIVED_PATH_ETH, PATH_WELCOME, DEFAULT_TITLE, VERSION } from '$lib/common';
  import { goto } from '$app/navigation';
  import { deepCopy } from '$lib/utilities/utilities';
  import { createSubportfolioAccount } from '$lib/plugins/networks/ethereum/createSubportfolioAccount';
	import { EmergencyKitManager } from '$plugins/EmergencyKitManager';
	import { onMount } from 'svelte';
	import { dateString } from '$lib/common/datetime';
  // import { jsPDF } from "jspdf";

  let currentlySelected: YakklCurrentlySelected;
  let yakklMiscStore: string;

  let settings: Settings | null;
  let id: string = '';
  let registered: YakklRegisteredData;
  let email: string = $state(''); 
  let userName: string = $state('');
  let primaryAccountName: string = $state('');
  let accountName: string = $state('');
  let address: string = $state('');
  let addressDerived: string = $state('');
  let blockchain: string = $state();
  let privateKey: string = $state('');
  let profile: Profile | null = null;
  let wordCount: number = $state();
  let mnemonic: string = $state();
  let displayDate: Date = $state();
  let derivedPath = $state(DEFAULT_DERIVED_PATH_ETH); //Index at end is dynamically created
  let successDialog = $state(false);
  let createDate: string;
  let updateDate: string;
  let registeredType: string = $state();
  let error = $state(false);
  let errorValue: string = $state();
  

  onMount(async () => {
    try {
      if (browserSvelte) {
        yakklMiscStore = getMiscStore();
        if (!yakklMiscStore) {
          goto(PATH_WELCOME);
        }

        currentlySelected = await getYakklCurrentlySelected();
        if (!currentlySelected || !currentlySelected.data) {
          goto(PATH_WELCOME);
        }
        
        if (isEncryptedData(currentlySelected.data)) {
          await decryptData(currentlySelected.data, yakklMiscStore).then(result => {
            currentlySelected.data = result as CurrentlySelectedData;
          });  
        }

        profile = await getProfile();
        if (!profile) {
          goto(PATH_WELCOME);
        }

        if (isEncryptedData(profile?.data)) {
          await decryptData(profile?.data, yakklMiscStore).then(result => {
            profile!.data = result as ProfileData;
          });
        }

        settings = await getSettings();
        if (settings !== null) {
          registeredType = settings.registeredType ? settings.registeredType : 'unknown reg type';
        } else {
          registeredType = 'unknown reg type';
        }

      }
    } catch (e) {
      error = true;
      errorValue = `Your subportfolio account was not created for the following reason ==> ${e}`;
      console.log(errorValue);
    }
  });


  async function createAccount() {
    try {
      if (!profile) {
        profile = await getProfile();
        if (isEncryptedData(profile!.data)) {
          await decryptData(profile!.data, yakklMiscStore).then(result => {
            profile!.data = result as ProfileData;
          });
        }
      }

      if (!yakklMiscStore) {
        yakklMiscStore = getMiscStore();
      }

      if (!profile || !profile.data || !yakklMiscStore) {
        throw 'Profile data does not appear to be valid or misc not valid. Please register or re-register. Thank you.';
      }

      userName = profile!.userName;
      registered = (profile!.data as ProfileData).registered;
      email = (profile!.data as ProfileData).email;

      if ((profile!.data as ProfileData)?.primaryAccounts?.length === 0) {
        throw 'You cannot derive a new account unless a primary account has been created through the registration process. Please register. Thank you.';
      }

      await createSubportfolioAccount(yakklMiscStore, currentlySelected, profile).then(async (result) => {
        try {
          currentlySelected = deepCopy(result); 
          if (isEncryptedData(currentlySelected.data)) {
            await decryptData(currentlySelected.data, yakklMiscStore).then(result => {
              currentlySelected.data = result as CurrentlySelectedData;
            });
          }

          accountName = currentlySelected.shortcuts.accountName;
          id = currentlySelected.id;
          blockchain = currentlySelected.shortcuts.network.blockchain;
          addressDerived = currentlySelected.shortcuts.address;
          createDate = dateString();
          updateDate = createDate;

          let yakklAccount: YakklAccount = (currentlySelected.data as CurrentlySelectedData).account as YakklAccount;
          if (isEncryptedData(yakklAccount.data)) {
            await decryptData(yakklAccount.data, yakklMiscStore).then(result => {
              yakklAccount!.data = result as AccountData;
            });
          }
          privateKey = (yakklAccount.data as AccountData).privateKey;

          let yakklPrimaryAccount: YakklPrimaryAccount = (currentlySelected.data as CurrentlySelectedData).primaryAccount as YakklPrimaryAccount;
          if (isEncryptedData(yakklPrimaryAccount.data)) {
            await decryptData(yakklPrimaryAccount.data, yakklMiscStore).then(result => {
              yakklPrimaryAccount!.data = result as PrimaryAccountData;
            });
          }

          primaryAccountName = yakklPrimaryAccount.name;
          address = yakklPrimaryAccount.address;
          wordCount = (yakklPrimaryAccount.data as PrimaryAccountData).wordCount as number;
          mnemonic = (yakklPrimaryAccount.data as PrimaryAccountData).mnemonic as string;
          
          derivedPath = `${DEFAULT_DERIVED_PATH_ETH}${yakklPrimaryAccount.index}'/0/${yakklPrimaryAccount.subIndex}`;
          displayDate = new Date(createDate);

          successDialog = true;
        } catch (e) {
          console.log(`Account Derived: Error inside: ${e}`);
          throw `${e}`;
        }
      }).catch(e => {
        console.log(`Account Derived: Error outside: ${e}`);
        throw `${e}`;
      });
    } catch (e) {
      error = true;
      errorValue = `Your subportfolio account was not created for the following reason: ${e}`;
      console.log(errorValue);
    }
  }

  function handlePrinting() {
    printKit();
  }

  function printKit() {
    if (browserSvelte) {
      try {
        window.print();
      } catch (e) {
        errorValue = `Your additional address did not get created for the following reason: ${e}`;
        console.log(errorValue);
      }
    }
  }

  
  async function handleDownload() {
    let ekAccountData: EmergencyKitAccountData = {
      id: id,
      registered: registered,
      email: email,
      userName: userName,
      blockchain: blockchain,
      portfolioAddress: address,
      portfolioName: primaryAccountName,
      subPortfolioAddress: addressDerived,
      subPortfolioName: accountName,
      privateKey: privateKey,
      mnemonic: mnemonic,
      createDate: createDate,
      updateDate: updateDate,
      version: VERSION,
      hash: '',
    };

    const emergencyKit = await EmergencyKitManager.createEmergencyKit([ekAccountData], true, yakklMiscStore);
    await EmergencyKitManager.downloadEmergencyKit(emergencyKit);
  }

</script>

<svelte:head>
	<title>
		{DEFAULT_TITLE}
	</title>
</svelte:head>

<div class="modal" class:modal-open={error}>
  <div class="modal-box relative">
    <!-- <label for="my-modal-3" class="btn btn-sm btn-circle absolute right-2 top-2">✕</label> -->
    <h3 class="text-lg font-bold">ERROR!</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" onclick={() => {error=false; goto(PATH_WELCOME)}}>Close</button>
    </div>
  </div>
</div>


<Modal bind:open={successDialog} autoclose>
  <div class="text-center">
      <svg aria-hidden="true" class="mx-auto mb-4 w-14 h-14 text-green-600 dark:text-gray-200 fill-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
      </svg>
            
      <h3 class="mb-2 text-lg font-normal text-green-700 dark:text-gray-400"><span class="font-bold">SUCCESS - </span> Additional Wallet Account Created!</h3>
      <div class="text-left">
        <h3 class="mb-1 text-lg font-bold text-green-900 ">(ONLY available for Pro version)</h3>
        <h4 class="mb-1 text-lg font-normal text-green-700 ">Next steps:</h4>
        <p class="mb-5 text-md font-normal text-green-900"><span class="font-bold">1. Click the Print button (if you have a secure printer you can trust).</span> This printout will be your emergency kit. Store it somewhere safe! Do not let anyone see it because it contains sensitive information!</p>
        <p class="mb-5 text-md font-normal text-green-900"><span class="font-bold">2. Click the Download button.</span> This will download this same emergency kit in a file format but it will be fully encrypted using your credentials that you just created! It's a good idea to store the encrypted file on an encrypted and secure USB drive (not a cold wallet - that is something different). Put the secured file and/or encrypted USB drive somewhere safe like your hardcopy emergency kit!</p>
        <p class="mb-5 text-md font-normal text-green-600"><span class="font-bold">3. Click the Close button.</span> This will close the credentials page and you're now ready to use YAKKL with confidence.</p>
      </div>
      <div class="text-center">
        <p class="mb-5 text-md font-bold text-green-600">If you are new to the Crypto world then be sure to checkout 'Getting Started' at the Yakkl University. You can find it on the Home screen.</p>
        <p class="mb-5 text-md font-bold text-green-600">Super excited to have you onboard!</p>
        <p class="mb-5 text-md font-bold text-green-600">Let us know how we can help!</p>
      </div>
      <Button on:click={() => successDialog=false} color='green'>Close</Button>
  </div>
</Modal>

{#await createAccount().then()}
  <div class="m-2 border-2 border-base-300 rounded-lg bg-base-100 text-base-content justify-center align-middle">
    <div class="text-center">
      <span class="font-bold mt-10 text-xl">Creating {blockchain} Subportfolio Account...</span>
    </div>
    <div class="text-center mt-10"><Spinner size="{10}"/></div>
  </div>
{:then _} 

<div class="print:hidden min-h-[40rem] mx-2"> 
  <div class="relative mt-1">
    <main class="p-2 max-h-[900px] rounded-xl bg-base-100 overflow-scroll border-2 border-stone-700 border-r-stone-700/75 border-b-slate-700/75">

      <div class="mt-[.35rem] ml-1 py-[8px] flex fixed top-0 bg-base-100 print:hidden">
        <!-- {#if registered.type === 'Pro' && registered.key} -->
        <Button class="btn-accent btn-sm inline-flex" on:click={handlePrinting}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          1. Print
        </Button>
        <Button class="ml-5 mr-5 inline-flex btn-accent btn-sm" on:click={handleDownload}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
          </svg>
          2. Download
        </Button>
        <Button id="close" class="inline-flex btn-accent btn-sm" on:click={() => goto(PATH_WELCOME)}>3. Close</Button>
        <!-- {:else}
        <div class="block btn btn-accent">
          <span class="text-xs font-bold">Emergency Kit only available for Pro version</span>
          <Button id="close" class="inline-flex" on:click={() => goto(PATH_WELCOME)}>Close</Button>
        </div>
        {/if} -->
      </div>

      <div class="print:hidden m-1 mt-12 mb-[12rem] rounded-t-lg bg-base-100 text-base-content overflow-scroll">
        <h4 class="text-center font-extrabold text-lg text-gray-300 mt-5">VERY IMPORTANT!</h4>
        <h4 class="text-center font-extrabold text-lg text-gray-300 mb-4">PRINT THIS PAGE and COPY YOUR SECRET PHRASE SOMEWHERE SAFE!</h4>
      
        <div class="ml-2 mr-2 text-center">
          <h3 class="text-lg font-medium leading-6 text-gray-300">{blockchain} - Subportfolio Account Secrets Emergency Kit</h3>
          <br/>
          <h4 class="block mt-1 text-sm text-gray-300">Print and guard this information!</h4>
          <h4 class="block text-sm text-gray-300">Put this document in a safe place!</h4>
          <h4 class="block text-sm text-gray-300">Your PASSWORD will not show on the screen, but will show on the print out! Handle Securely!</h4>
          <h4 class="block text-sm text-secondary">Subportfolio Account</h4>
        </div>

        <div class="mt-5 border-t mx-1 border-gray-400 break-words overflow-x-scroll">
          <dl class="divide-y divide-gray-400">
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-xs ml-1 text-gray-700 mt-1">USERNAME</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{userName}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-xs ml-1 text-gray-700 mt-1">PORTFOLIO ACCOUNT NAME</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{primaryAccountName}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-xs ml-1 text-gray-700 mt-1">PORTFOLIO ACCOUNT</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{address}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-xs ml-1 text-gray-700 mt-1">SUBPORTFOLIO NAME</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{accountName}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-xs ml-1 text-gray-700 mt-1">SUBPORTFOLIO</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{addressDerived}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-xs ml-1 text-gray-700 mt-1">PRIVATE KEY</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{privateKey}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-xs ml-1 text-gray-700 mt-1">SECRET PHRASE!</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{mnemonic}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-xs ml-1 text-gray-700 mt-1">DERIVED PATH (internal)</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{derivedPath}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-xs ml-1 text-gray-700 mt-1">DATE CREATED</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{displayDate}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-xs ml-1 text-gray-700 mt-1">EMAIL</dt>
              <dd class="text-sm font-extrabold font-mono text-gray-700 col-span-4 ml-5 mt-0 break-all">{email}</dd>
            </div>
          </dl>
        </div>
        <hr/>
        <span class="block mt-5 text-base text-gray-300 justify-center relative"><span class="font-bold">VERY IMPORTANT:</span> NEVER EVER GIVE ANYONE THE INFORMATION ON THIS PAGE (except for CRYPTO ADDRESS since it is public)! NO ONE FROM YAKKL WILL EVER ASK FOR YOUR PRIVATE KEY, PASSWORD, OR SECRET PHRASE! If anyone, any site, or any project ever asks for anything other than your public crypto address then THEY MOST LIKELY ARE SCAMMERS! A scammer's website will look good, they may show a good number of social media followers, or an "influencer" may recommend them (maybe not even knowing). But, if they ask for anything except your crypto address then treat them like a scammer to stay safe!</span>
        <br/>
        <span class="block mt-2 text-base text-gray-300 justify-center relative"><span class="font-bold">IMPORTANT:</span> The {wordCount} words MUST be in the order above! DO NOT mix the order up if you need to enter them to recover your account!</span>
        <br/>
        <span class="block mt-2 text-base text-gray-300 justify-center relative"><span class="font-bold">IMPORTANT:</span> To safely destroy this document, redact and shred or burn it!</span>     
      </div>

    </main>
  </div>
</div>

  <!-- {#if registered.type === 'Pro' && registered.key} -->
  <!-- Will need to change back or make updates after pre-launch -->
  <div class="hidden print:block">
    <div class="ml-1 mr-1 mb-[10rem] print:ml-0 print:mr-0 w-[1000px] bg-white overscroll-none overflow-scroll">
      <h4 class="text-center font-extrabold text-lg text-gray-900 m-4 print:hidden">VERY IMPORTANT! PRINT THIS PAGE AND STORE SOMEWHERE SAFE!</h4>
      <div id="printPDF">

        <!-- TBD - Need to look into bringing down logo, make larger, raise text -->
        <div class="items-center">
          <!-- svelte-ignore a11y_missing_attribute -->
          <img class="w-24 h-24 z-10 ml-5" src="/images/logoBullFav128x128.png">
        </div>

        <div class="w-full text-center">
          <h3 class="text-lg print:text-2xl font-medium leading-6 text-gray-900">{blockchain} - Subportfolio Account Emergency Kit</h3>
          <br/>
          <h3 class="block mt-1 text-sm print:text-lg text-gray-700">Print and guard this information!</h3>
          <h3 class="block mt-1 text-sm print:text-lg text-gray-700">Put this document in a safe place!</h3>
          <h4 class="block text-sm text-secondary">Subportfolio Account</h4>
      </div>

        <div class="mt-5 border-t border-gray-400">

          <dl class="divide-y divide-gray-400">
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">USERNAME</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0">{userName}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">PORTFOLIO ACCOUNT NAME</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{primaryAccountName}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">PORTFOLIO ACCOUNT</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{address}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">SUBPORTFOLIO NAME</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{accountName}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">SUBPORTFOLIO</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{addressDerived}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">PRIVATE KEY</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{privateKey}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">SECRET PHRASE!</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{mnemonic}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">DERIVED PATH (internal)</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{derivedPath}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-gray-100">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">DATE CREATED</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{displayDate}</dd>
            </div>
            <div class="py-4 grid grid-cols-5 bg-white">
              <dt class="text-sm ml-3 font-medium text-gray-500 mt-1">EMAIL</dt>
              <dd class="text-xl font-extrabold font-mono text-gray-900 col-span-4 mt-0 break-all">{email}</dd>
            </div>
          </dl>

        </div>

        <hr/>
        <span class="block mt-5 text-base text-gray-900 justify-center relative"><span class="font-bold">VERY IMPORTANT:</span> NEVER EVER GIVE ANYONE THE INFORMATION ON THIS PAGE (except for CRYPTO ADDRESS since it is public)! <span class="underline">NO ONE FROM YAKKL WILL EVER ASK FOR YOUR PRIVATE KEY, PASSWORD, OR SECRET PHRASE!</span> If anyone, any site, or any project ever asks for anything other than your public crypto address then THEY MOST LIKELY ARE SCAMMERS! A scammer's website will look good, they may show a good number of social media followers, or an "influencer" may recommend them (maybe not even knowing). But, if they ask for anything except your crypto address then treat them like a scammer to stay safe!</span>
        <br/>
        <span class="block mt-2 text-base text-gray-900 justify-center relative"><span class="font-bold">IMPORTANT:</span> The {wordCount} words MUST be in the order above! DO NOT mix the order up if you need to enter them to recover your account!</span>
        <br/>
        <span class="block mt-3 text-base text-gray-900 justify-center relative"><span class="font-bold">IMPORTANT:</span> To safely destroy this document, redact and shred or burn it!</span>
        <br/>
        <br/>
        <div class="w-full text-center">
          YAKKL® Smart Wallet - Version {VERSION} {registeredType} - https://yakkl.com
        </div>
      </div>
    </div>
  </div>
  
  <!-- {:else}
  <div class="hidden print:block">
    <div class="ml-1 mr-1 mb-[10rem] print:ml-0 print:mr-0 w-[1000px] bg-white overscroll-none overflow-scroll">
      <div id="printPDF"> -->

        <!-- TBD - Need to look into bringing down logo, make larger, raise text -->
        <!-- <div class="items-center"> -->
          <!-- svelte-ignore a11y_missing_attribute -->
          <!-- <img class="w-24 h-24 z-10 ml-5" src="/images/logo128x128.png">
        </div>

        <div class="w-full text-center">
          <h3 class="text-lg print:text-2xl font-medium leading-6 text-gray-900">{network} - Subportfolio Account Secrets Emergency Kit</h3>
          <br/>
          <h4 class="block mt-1 text-sm print:text-lg text-gray-700">This feature is only available with the Pro version.</h4>
          <h4 class="block mt-1 text-sm print:hidden text-gray-700">Upgrade to Pro for this and many other features!</h4>
        </div>

      </div>
    </div>
  </div>
  {/if} -->
  <!--bottom-[63px]-->

  <!-- <div style="width: 428px;" class="justify-center py-[10px] flex flex-row fixed top-0 min-w-[{containerWidth}px] max-w-[{containerWidth}px] bg-white dark:bg-gray-900 print:hidden"> -->
    <!-- {#if registered.type === 'Pro' && registered.key} -->

    <!-- <Button class="inline-block" on:click={handlePrint}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
      </svg>
      1. Print
    </Button>
    <Button class="ml-5 mr-5 inline-block" on:click={handleDownload}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
      </svg>
      2. Download
    </Button>
    <Button id="close" class="inline-block" on:click={() => goto(PATH_WELCOME)}>
      3. Close
    </Button> -->
    <!-- {:else}
    <div class="block">
      <span class="text-xs font-bold">Emergency Kit only available for Pro version</span>
      <Button id="close" class="inline-block" on:click={() => goto(PATH_WELCOME)}>Close</Button>
    </div>
    {/if} -->
  <!-- </div> -->
{/await}

