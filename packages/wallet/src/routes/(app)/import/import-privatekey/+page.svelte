<script lang="ts">
  import {browser as browserSvelte} from '$app/environment';
  import { setYakklAccountsStorage, setYakklCurrentlySelectedStorage, setProfileStorage, getYakklAccounts, getProfile, getYakklCurrentlySelected, getMiscStore } from '$lib/common/stores';
  import { yakklAccount as yakklAccountDefault } from '$lib/models/dataModels';
  import Back from '$lib/components/Back.svelte';
  import { getWallet } from '$lib/utilities/ethereum';
  import { encryptData, decryptData } from '$lib/common/encryption';
  import { deepCopy, getSymbol } from '$lib/utilities/utilities';
  import { goto } from '$app/navigation';
  import { PATH_WELCOME, VERSION } from '$lib/common/constants';
  import { createForm } from "svelte-forms-lib";
  import * as yup from 'yup';
  import { Confetti } from "svelte-confetti";
	import { AccountTypeCategory, isEncryptedData, NetworkType, type AccountData, type CurrentlySelectedData, type Profile, type ProfileData, type YakklAccount, type YakklCurrentlySelected } from '$lib/common';
  import WalletManager from '$lib/plugins/WalletManager';
  import type { Wallet } from '$lib/plugins/Wallet';
	import { onMount } from 'svelte';
	import { dateString } from '$lib/common/datetime';

  let wallet: Wallet;

  let currentlySelected: YakklCurrentlySelected;
  let yakklMiscStore: string;
  let chainId: number = 1;

  let error=false;
  let errorValue: any;
  let showConfetti = false;
  
  onMount(async () => {
    try {
      currentlySelected = await getYakklCurrentlySelected();

      yakklMiscStore = getMiscStore();
      wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM_PROD);
    } catch(e) {
      console.log(`Error decrypting data: ${e}`);
    }
  });

  // currentlySelected = deepCopy(yakklCurrentlySelectedStore);

  const { form, errors, state, isValid, handleChange, handleSubmit } = createForm({
    initialValues: { accountName: "", alias: "", prvKey: ""},
    validationSchema: yup.object().shape({
      accountName: yup
        .string()                
        .required('Please enter your account name for the address'),
      alias: yup
        .string(),
      prvKey: yup
        .string()
        .required('Please paste or enter your Private Key for the address you are importing'),
    }),
    onSubmit: async data => {
      try {
        await handleImport(data.accountName, data.alias, data.prvKey);
      } catch (e) {
        error = true;
        // let er = (!password || !confirmPassword ? String(e) : String(e).replace(password, "REDACTED").replace(confirmPassword, "REDACTED"));
        errorValue = `Following error occurred: ${e}`;
        console.log(errorValue);
      }
    }
  });
 
  
  async function checkIfAccountExists(name: string, address: string, alias: string) {
    let yakklAccounts: YakklAccount[] = [];
    yakklAccounts = await getYakklAccounts();

    let result = yakklAccounts.find(x => {
      if (x.address === address || x.name === name || (alias && x.alias === alias)) 
        return true;
    });
    if (result) {
      return true;
    }    
    return false;
  }


  async function handleImport(accountName: string, alias: string, prvKey: string) {
    if (browserSvelte) {
      try {        
        if (!prvKey.trim()) {
          errorValue = `Please enter a valid private key.`;
          error = true;
          return;
        }
          
        if (!accountName.trim()) {
          errorValue = `Please enter a valid account name.`;
          error = true;
          return;
        }

        if (prvKey.startsWith('0x')) {
          prvKey = prvKey.substring(2);
        }

        if (await checkIfAccountExists(accountName, await getWallet(prvKey).getAddress(), alias)) {
          errorValue = `Account already exists. Please enter a different account name, alias, or private key.`;
          error = true;
          return;
        }

        showConfetti = true;

        (document.getElementById("import") as HTMLInputElement).disabled = true;

        if (!currentlySelected) currentlySelected = await getYakklCurrentlySelected();
        if (isEncryptedData(currentlySelected.data)) {
          await decryptData(currentlySelected.data, yakklMiscStore).then(result => {
            currentlySelected.data = result as CurrentlySelectedData;
          });
        }

        let profile: Profile = (currentlySelected.data as CurrentlySelectedData).profile as Profile;
        let yakklAccount = yakklAccountDefault;
        
        if (profile) {
          profile = deepCopy((currentlySelected.data as CurrentlySelectedData).profile);
        } else {
          profile = await getProfile() as Profile;
          (currentlySelected.data as CurrentlySelectedData).profile = profile;
        }
        
        if (isEncryptedData(profile.data)) {
          await decryptData(profile.data, yakklMiscStore).then(async result => {
            profile.data = result as ProfileData;
          });
        }

        if (profile.data !== undefined && (profile.data as ProfileData).meta) {
          (profile.data as ProfileData).meta = {}; // Clear meta data
        }

        currentlySelected.shortcuts.type = 'Mainnet';  // Force mainnet for provider
        currentlySelected.shortcuts.chainId = chainId;  // Force mainnet for provider

        // Alchemy wallet
        const walletNew = getWallet(prvKey);

        yakklAccount.id = currentlySelected.id;
        yakklAccount.blockchain = currentlySelected.shortcuts.network.blockchain;

        (yakklAccount.data as AccountData).privateKey = prvKey;
        (yakklAccount.data as AccountData).path = ''; // Imported accounts are not derived
        yakklAccount.value = 0n; // Default
        yakklAccount.address = await walletNew.getAddress();
        yakklAccount.name = accountName;
        yakklAccount.alias = alias;
        yakklAccount.description = 'Imported account using private key'; 
        yakklAccount.value = 0n; // Default

        // console.log('Import: yakklAccount 1:', deepCopy(yakklAccount));
        await wallet.getBalance(yakklAccount.address).then(result => {
          if (result) yakklAccount.value = result;
        }).catch(e => {
          console.log(`Import: error getting balance: ${e}`);
        });

        yakklAccount.index = -1;
        yakklAccount.accountType = AccountTypeCategory.IMPORTED; 
        yakklAccount.primaryAccount = null;  // Imported accounts do not have primary accounts 
        yakklAccount.class = "Default";  
        yakklAccount.includeInPortfolio = true;   
        yakklAccount.createDate = dateString();
        yakklAccount.updateDate = dateString();
        yakklAccount.version = VERSION;

        if (!isEncryptedData(yakklAccount.data)) {
          await encryptData(yakklAccount.data, yakklMiscStore).then(result => {
            yakklAccount.data = result;
          }).catch(e => {
            console.log(`Import: error encrypting account data: ${e}`);
          });
        }

        (currentlySelected.data as CurrentlySelectedData).account = yakklAccount;
        (currentlySelected.data as CurrentlySelectedData).primaryAccount = null;  // Imported accounts do not have a primary account

        let yakklAccounts: YakklAccount[] = [];
        await getYakklAccounts().then(results => {
          yakklAccounts = results;
        });

        if (!Array.isArray(yakklAccounts)) {
          yakklAccounts = [];
        }

        if (profile.data) { 
          if ((profile.data as ProfileData).importedAccounts === undefined || 
            (profile.data as ProfileData).importedAccounts === null ||
            !Array.isArray((profile.data as ProfileData).importedAccounts)) {
            (profile.data as ProfileData).importedAccounts = [];
          } 
        }

        (profile.data as ProfileData).importedAccounts.push(yakklAccount);
        
        if (!isEncryptedData(profile.data)) {
          await encryptData(profile.data, yakklMiscStore).then(result => {
            profile.data = result;
          });
        }

        (currentlySelected.data as CurrentlySelectedData).profile = profile;

        currentlySelected.shortcuts.value = (!yakklAccount.value ? '0.0' : yakklAccount.value);
        currentlySelected.shortcuts.address = yakklAccount.address;
        currentlySelected.shortcuts.accountName = accountName;
        currentlySelected.shortcuts.alias = alias;
        currentlySelected.shortcuts.accountType = AccountTypeCategory.IMPORTED;
        currentlySelected.shortcuts.primary = null;
        
        currentlySelected.shortcuts.network.blockchain = yakklAccount.blockchain;
        currentlySelected.shortcuts.network.chainId = chainId; // Defaults to mainnet
        currentlySelected.shortcuts.network.name = 'Mainnet'; // Defaults to mainnet - should change to read from getNetworkName(chainId)
        currentlySelected.shortcuts.network.explorer = 'https://etherscan.io'; // Defaults to etherscan
        currentlySelected.shortcuts.network.type = NetworkType.MAINNET; // Defaults to mainnet
        currentlySelected.shortcuts.network.decimals = 18; // Defaults to 18
        currentlySelected.shortcuts.network.symbol = getSymbol(yakklAccount.blockchain);

        yakklAccounts.push(yakklAccount);

        await setProfileStorage(profile);
        await setYakklAccountsStorage(yakklAccounts);
        await setYakklCurrentlySelectedStorage(currentlySelected);
        
        (document.getElementById("import") as HTMLInputElement).disabled = false;
        goto(PATH_WELCOME);
      } catch(e) {
        (document.getElementById("import") as HTMLInputElement).disabled = false;
        let ev = String(e).replace(yakklMiscStore, 'REDACTED').replace(prvKey, 'KEY REDACTED');
        errorValue = `Import failed. Make sure to use the correct private key data - ${ev}`;
        error = true;
      }
   }
  }

</script>
  
<div class="modal" class:modal-open={error}>
  <div class="modal-box relative">
    <h3 class="text-lg font-bold">ERROR!</h3>
    <p class="py-4">{errorValue}</p>
    <div class="modal-action">
      <button class="btn" on:click={() => error=false}>Close</button>
    </div>
  </div>
</div>

{#if showConfetti}
<Confetti />
{/if}

<div class="flex flex-col relative justify-center left-0 ">
  <Back defaultClass="-left-3 -top-3"/>

  <div class="pt-1 justify-center w-[306px] ml-[42.25px]  font-bold">

    <!--
    <div class="flex justify-center">
      <div class="mb-3 w-96">
        <label for="formFile" class="form-label inline-block mb-2 text-white">JSON file to import</label>
        <input class="form-control
          block
          w-full
          px-3
          py-1.5
          text-base
          font-normal
          text-gray-700
          bg-white bg-clip-padding
          border border-solid border-gray-300
          rounded
          transition
          ease-in-out
          m-0
          focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" type="file" id="formFile"
        />
      </div>
    </div> 
    -->

    <span class="text-base text-center text-white font-normal">Import Address (using private key)</span>

    <form class="w-full" on:submit|preventDefault={handleSubmit}>
      <div class="my-1">
        <!-- "placeholder:italic block p-1 mt-2 text-md font-normal w-full border-2 border-purple-600 text-gray-700 bg-gray-100 bg-clip-padding transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" -->
        <input
          id="accountName"
          class="input input-bordered input-primary w-full mt-2"
          placeholder="(Required) Enter account name here..."
          autocomplete="off"
          bind:value={$form.accountName}
          on:change="{handleChange}"
          required
        />
        {#if $errors.accountName}
        <small class="text-red-600 font-bold animate-pulse">{$errors.accountName}</small>
        {/if}
        <!-- placeholder:italic block p-1 mt-2 text-md font-normal w-full border-2 border-purple-600 text-gray-700 bg-gray-100 bg-clip-padding transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none -->
        <input
          id="alias"
          class="input input-bordered input-primary w-full mt-2"
          placeholder="(Optional) Enter account alias here..."
          autocomplete="off"
          bind:value={$form.alias}
          on:change="{handleChange}"
        />
        <!-- placeholder:italic block p-1 mt-2 text-md font-normal w-[306px] border-2 border-purple-600 text-red-600 dark:border-white dark:text-white -->
        <textarea
          class="textarea textarea-primary mt-2 mb-2 w-[306px]"
          id="prvKey"
          placeholder="(Required) Enter private key here..."
          bind:value={$form.prvKey}
          on:change="{handleChange}"
          autocomplete="off"
          style="resize: none;"
          rows="3"
          aria-label="Private key"
          required
        />
        {#if $errors.prvKey}
        <small class="text-red-600 font-bold animate-pulse">{$errors.prvKey}</small>
        {/if}
        
        <div class="mt-2 mb-3">
          <div class="flex justify-center">
            <!-- bg-white text-center px-6 py-2 border-2 border-purple-600 text-purple-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 dark:hover:bg-white focus:outline-none focus:ring-0 transition duration-150 ease-in-out ml-2 w-[125px]"> -->
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-interactive-supports-focus -->
              <button on:click={() => goto(PATH_WELCOME)} 
                  type="button"
                  aria-label="Cancel"
                  class="btn-sm btn-accent uppercase rounded-full">
                  Cancel
              </button>
              <button 
                  id="import"
                  type="submit" 
                  class="btn-sm btn-primary uppercase rounded-full ml-2"
                  aria-label="Import">
                  Import
              </button>
          </div>
        </div>   
  
        <!-- <div class="mt-3 mb-3 pt-1">
          <div class="flex space-x-2 justify-center">
            <div on:click={() => goto(PATH_WELCOME)}
              role="button" 
              aria-label="Cancel" 
              class="inline-block text-center px-6 py-2 border-2 border-purple-600 text-purple-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-opacity-5 bg-white focus:outline-none focus:ring-0 transition duration-150 ease-in-out ml-2 w-[125px]">
              Cancel
            </div>
            <button
              id="import"
              type="submit"
              class="inline-block text-center px-6 py-2 border-2 border-purple-600 text-purple-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-opacity-5 bg-white focus:outline-none focus:ring-0 transition duration-150 ease-in-out ml-2 w-[125px]"
              data-mdb-ripple="true"
              data-mdb-ripple-color="light">
              <span>Import</span>
            </button>
          </div>
        </div> -->
      </div>
    </form>
  </div>
</div>

  
