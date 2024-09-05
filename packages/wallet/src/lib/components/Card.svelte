<script lang="ts">
  // Import statements
  import { goto } from '$app/navigation';
  import { browser as browserSvelte } from '$app/environment';
  import { createForm } from "svelte-forms-lib";
  import * as yup from 'yup';
  import { Modal, Button, SpeedDial, SpeedDialButton } from 'flowbite-svelte';
  import { 
    setSettings, getProfile, getSettings, yakklVersionStore, yakklPricingStore, yakklUserNameStore, 
    getYakklPrimaryAccounts, setYakklCurrentlySelectedStorage, 
    setProfileStorage, getYakklCurrentlySelected, getMiscStore, 
    yakklCurrentlySelectedStore, yakklAccountsStore, yakklContactsStore 
  } from '$lib/common/stores';
  import {PATH_WELCOME, YAKKL_ZERO_ADDRESS, PATH_LOGOUT, PATH_LOCK } from '$lib/common/constants';
  import ClipboardJS from 'clipboard'; 
  import QR from '$lib/components/QR.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { truncate, handleOpenInTab, timeoutClipboard, checkUpgrade } from "$lib/utilities/utilities";
  import { encryptData, decryptData } from '$lib/common/encryption';
  import { startCheckPrices, stopCheckPrices, getPricesCoinbase } from '$lib/tokens/prices';
  import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
  import { AccountTypeCategory, NetworkType, RegistrationType, isEncryptedData, 
    type CurrentlySelectedData, type Network, type Profile, type ProfileData, 
    type Settings, type YakklAccount, type YakklCurrentlySelected, 
    type YakklPrimaryAccount } from '$lib/common';
  import type { BigNumberish } from '$lib/common/bignumber';
  import { Toast } from 'flowbite-svelte';
  import { slide } from 'svelte/transition';  
  import WalletManager from '$lib/plugins/WalletManager';
  import { Wallet } from '$lib/plugins/Wallet';
  import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
	import Accounts from './Accounts.svelte';

  export let id = "card";
  
  let wallet: Wallet;
  
  // Pull this from the store later
  let networks: Network[] = [{
    blockchain: 'Ethereum',
    name: 'Mainnet',
    chainId: 1,
    symbol: 'ETH',
    type: NetworkType.MAINNET,
    explorer: 'https://etherscan.io',
    decimals: 18,
  },
  {
    blockchain: 'Ethereum',
    name: 'Sepolia',
    chainId: 11155111,
    symbol: 'ETH',
    type: NetworkType.TESTNET,
    explorer: 'https://sepolia.etherscan.io',
    decimals: 18,
  },];

  let network: Network = networks[0];
  let networkLabel = 'Mainnet';
  let addressShow: string;
  let address: string;
  let name: string;
  let nameShow: string;
  let valueFiat = '0.00';
  let showAccountsModal = false;
  let showContacts = false;
  let showRecv = false;
  let userName = $yakklUserNameStore;

  let upgrade = false;
  let serialNumber = ''; 
  let promoCode = 'BETA';

  let step1 = false;
  let price: number = 0;
  let prevPrice: number = 0;
  let direction: string = 'fl';
  let showTestNetworks = true;
  let yakklSettings: Settings;
  let checkPricesProvider: string = 'coinbase';
  let checkPricesInterval: number = 10; // Seconds
  let error = false;
  let errorValue: string;
  let assetPriceValue: BigNumberish = 0n;
  let assetPrice: string = '';
  let card = 'ethereum-background.png';
  let clipboard: ClipboardJS;

  let yakklMiscStore: string = getMiscStore();
  let symbolLabel: string;
  let currencyLabel: string;
  let currency: Intl.NumberFormat;
  let shortcutsValue: EthereumBigNumber = EthereumBigNumber.from(0);
  let chainId: number = 1;
  let formattedEtherValue: string;
  let currentlySelected: YakklCurrentlySelected;

  //////// Toast
  let toastStatus = false;
  let toastCounter = 3;
  let toastMessage = 'Success';
  let toastType = 'success';

  function toastTrigger(count = 3, msg = 'Success') {
    toastStatus = true;
    toastCounter = count;
    toastMessage = msg;
    timeout();
  }

  function timeout(): NodeJS.Timeout | void {
    if (--toastCounter > 0) return setTimeout(timeout, 1000);
    toastStatus = false;
  }

  $: {
    try {
      if ($yakklCurrentlySelectedStore) currentlySelected = $yakklCurrentlySelectedStore;
      assetPriceValue = $yakklPricingStore?.price ?? 0n;
      assetPrice = currency ? currency.format(Number(assetPriceValue)) : '0.00';
      chainId = currentlySelected.shortcuts.network.chainId ?? 1;
      networkLabel = currentlySelected.shortcuts.network.name ?? network.name;
      shortcutsValue = EthereumBigNumber.from(currentlySelected.shortcuts.value ?? 0n);
      startPricingChecks(); // Here because of different accounts with different values
      updateValuePriceFiat();
    } catch (e) {
      console.log(e);
    }
  }

  onMount(async () => {
    try {
      if (browserSvelte) {
        toastStatus = false;
        if (!$yakklCurrentlySelectedStore) yakklCurrentlySelectedStore.set(await getYakklCurrentlySelected());
        if (!yakklMiscStore) yakklMiscStore = getMiscStore();

        if ($yakklCurrentlySelectedStore) {
          currentlySelected = $yakklCurrentlySelectedStore;
          currentlySelected.shortcuts.networks = networks;
          yakklCurrentlySelectedStore.set(currentlySelected);

          currencyLabel = currentlySelected.preferences.currency.code ?? 'USD';
          currency = new Intl.NumberFormat('en-US', { style: "currency", currency: currencyLabel });
          symbolLabel = currentlySelected.shortcuts.symbol ?? 'ETH';
          chainId = currentlySelected.shortcuts.network.chainId ?? 1;

          wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], chainId, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);

          const val = await getBalance(currentlySelected.shortcuts.network.chainId, currentlySelected.shortcuts.address);
          $yakklCurrentlySelectedStore.shortcuts.value = val ?? 0n;
          
          if (currentlySelected.shortcuts.value) updateValuePriceFiat();
          clipboard = new ClipboardJS('.clip');
          // updateUpgradeButton();
          startPricingChecks();
        }
      }
    } catch (e) {
      console.log(`onMount: ${e}`);
    }
  });

  async function startPricingChecks() {
    // Keep checking the prices
    startCheckPrices(checkPricesProvider, checkPricesInterval);
    // If the value === 0 then stop the checks
    // const numValue = shortcutsValue.toNumber();
    // if (numValue !== null && numValue > 0) {
    //   startCheckPrices(checkPricesProvider, checkPricesInterval);
    // } else {
    //   stopCheckPrices();
    // }
  }

  onDestroy(async () => {
    if ($yakklCurrentlySelectedStore) {
      currentlySelected = $yakklCurrentlySelectedStore;
      if (currentlySelected) {
        await setYakklCurrentlySelectedStorage(currentlySelected);
      }
    }
    stopCheckPrices();
  });

  function updateUpgradeButton() {
    if (checkUpgrade()) {
      if (browserSvelte) {
        const upgradeButton = document.getElementById('upgrade');
        if (upgradeButton) {
          upgradeButton.style.display = 'none';
        }
      }
    }
  }

  async function updateValuePriceFiat(): Promise<void> {
    try {
      if ($yakklCurrentlySelectedStore?.shortcuts.address === YAKKL_ZERO_ADDRESS) {
        if ($yakklCurrentlySelectedStore) {
          let updatedCurrentlySelected: YakklCurrentlySelected = {
            ...$yakklCurrentlySelectedStore,
            shortcuts: {
              ...$yakklCurrentlySelectedStore.shortcuts,
              value: EthereumBigNumber.from(0),
            },
            preferences: $yakklCurrentlySelectedStore.preferences,
            data: $yakklCurrentlySelectedStore.data,
          };

          // Set the modified copy back to the store
          yakklCurrentlySelectedStore.set(updatedCurrentlySelected);
          await setYakklCurrentlySelectedStorage($yakklCurrentlySelectedStore);
        }
        return;
      }

      if (!$yakklCurrentlySelectedStore?.shortcuts.value || $yakklCurrentlySelectedStore.shortcuts.value === EthereumBigNumber.from(0)) {
        if ($yakklCurrentlySelectedStore) {
          let updatedCurrentlySelected: YakklCurrentlySelected = {
            ...$yakklCurrentlySelectedStore,
            shortcuts: {
              ...$yakklCurrentlySelectedStore.shortcuts,
              value: EthereumBigNumber.from(0),
            },
            preferences: $yakklCurrentlySelectedStore.preferences,
            data: $yakklCurrentlySelectedStore.data,
          };

          // Set the modified copy back to the store
          yakklCurrentlySelectedStore.set(updatedCurrentlySelected);
          await setYakklCurrentlySelectedStorage($yakklCurrentlySelectedStore);    
        }
        return;
      }

      currentlySelected = $yakklCurrentlySelectedStore;

      if (currentlySelected.shortcuts.address) {
        startPricingChecks();
        if (!$yakklPricingStore?.price) {
          getPricesCoinbase('eth-usd').then(results => {
            yakklPricingStore.set({ provider: checkPricesProvider, id: '-1', pair: 'ETH/USD', price: results.price });
          });
        }

        // Convert the value to EthereumBigNumber
        // Convert from Wei to Ether and get string representation
        const etherValueString = formatEther(currentlySelected.shortcuts.value);
        if ($yakklPricingStore && $yakklPricingStore.price) {
          price = $yakklPricingStore.price;
        } else {
          price = 0;
        }

        if (prevPrice > price) {
          direction = 'dn';
        } else if (prevPrice < price) {
          direction = 'up';
        } else {
          direction = 'fl'; // flat
        }

        prevPrice = price;

        const etherValue = parseFloat(etherValueString);
        if (!isNaN(etherValue)) {
          valueFiat = currency ? currency.format(etherValue * price) : '0.00';       
          // Format Ether value to display up to 5 decimal places
          formattedEtherValue = etherValue.toFixed(5);
        } else {
          valueFiat = '0.00';
        }
      } else {
        valueFiat = '0.00';
        stopCheckPrices();
      }
    } catch (e) {
      console.log(`updateValuePriceFiat: ${e}`);
    }
    updateCurrentlySelected();
  }

  function updateCurrentlySelected() {
    try {
      if ($yakklCurrentlySelectedStore) {
        address = $yakklCurrentlySelectedStore.shortcuts.address;
        addressShow = truncate($yakklCurrentlySelectedStore.shortcuts.address, 6) + address.substring(address.length - 4);
        name = $yakklCurrentlySelectedStore.shortcuts.accountName;
        currencyLabel = $yakklCurrentlySelectedStore.preferences.currency.code ?? 'USD';

        if (address === YAKKL_ZERO_ADDRESS) {
          nameShow = '0x0000...0000';
        } else {
          nameShow = truncate(name, 20);
        }
      }
    } catch (e) {
      console.log(`updateCurrentlySelected: ${e}`);
    }
  }

  async function getUserName(email: string) {
    try {
      if ($yakklUserNameStore) {
        userName = $yakklUserNameStore;
        return $yakklUserNameStore;
      }

      if (!yakklMiscStore) {
        return undefined;
      }

      getProfile().then(async result => {
        let profile = result as Profile;

        if (isEncryptedData(profile.data)) {
          await decryptData(profile.data, yakklMiscStore).then(async (result) => {
            profile.data = result as ProfileData;
            userName = profile.userName;
            yakklUserNameStore.set(userName);
          });
        } else {
          userName = profile.userName;
          yakklUserNameStore.set(userName);
        }

        (profile.data as ProfileData).email = email;
        await encryptData(profile.data, yakklMiscStore).then(async (result) => {
          profile.data = result;
          await setProfileStorage(profile);
        });
      });
    } catch (e) {
      console.log(`getUserName: ${e}`);
      return undefined;
    }
  }

  async function getRegistrationKey(email: string): Promise<string | undefined> {
    try {
      if (!yakklMiscStore) {
        return Promise.reject(undefined);
      }

      const profile = await getProfile();
      if (profile) {
        if (isEncryptedData(profile.data)) {
          await decryptData(profile.data, yakklMiscStore).then(async (result) => {
            profile.data = result as ProfileData;

            let key = profile.data?.registered?.key;
            let regType = profile.data?.registered?.type;

            if (profile.data.email !== email) {
              profile.data.email = email;
              await encryptData(profile.data, yakklMiscStore).then(data => {
                profile.data = data;
              });

              await setProfileStorage(profile);
            }

            if (key && regType !== RegistrationType.STANDARD) {
              return Promise.resolve(key);
            } else {
              return Promise.reject(undefined);
            }
          });
        }
      } else {
        return Promise.reject(undefined);
      }
    } catch (e) {
      console.log(`getRegistrationKey: ${e}`);
      throw e;
    }
    return Promise.reject(undefined);
  }

  async function handleAccounts(account: YakklAccount) {
    try {
      if (!account) {
        console.log('Account is not defined.');
        return;
      }

      if ($yakklCurrentlySelectedStore) currentlySelected = $yakklCurrentlySelectedStore;

      if (currentlySelected && isEncryptedData(currentlySelected.data)) {
        const decryptedData = await decryptData(currentlySelected.data, yakklMiscStore);
        currentlySelected.data = decryptedData as CurrentlySelectedData;
      }

      if (currentlySelected) {
        currentlySelected.shortcuts.accountType = account.accountType;
        currentlySelected.shortcuts.address = account.address;
        currentlySelected.shortcuts.primary = account.primaryAccount;
        currentlySelected.shortcuts.accountName = account.name;

        if (account.accountType === AccountTypeCategory.PRIMARY) {
          let primaryAccounts = await getYakklPrimaryAccounts();
          let primaryAccount = primaryAccounts.find(primary => primary.address === account.address);
          (currentlySelected.data as CurrentlySelectedData).primaryAccount = primaryAccount as YakklPrimaryAccount;
        }

        (currentlySelected.data as CurrentlySelectedData).account = account;
        if (!isEncryptedData(currentlySelected.data)) {
          const encryptedData = await encryptData(currentlySelected.data, yakklMiscStore);
          currentlySelected.data = encryptedData;
        }

        currentlySelected.shortcuts.value = await getBalance(currentlySelected.shortcuts.network.chainId, currentlySelected.shortcuts.address);
        await setYakklCurrentlySelectedStorage(currentlySelected);
        showAccountsModal = false;
        updateValuePriceFiat();
        goto(PATH_WELCOME);
      }
    } catch (e) {
      console.log('handleAccounts:', e);
      showAccountsModal = false;
    }
    showAccountsModal = false;
  }

  async function handleNetworkTypeChange(net: Network) {
    try {
      if ($yakklCurrentlySelectedStore) {
        currentlySelected = $yakklCurrentlySelectedStore;
        currentlySelected.shortcuts.chainId = net.chainId;
        chainId = net.chainId;
        network = net;
        currentlySelected.shortcuts.network = net;

        if (wallet) await wallet.setChainId(currentlySelected.shortcuts.network.chainId);

        direction = 'fl';
        currentlySelected.shortcuts.symbol = network.symbol;
        currentlySelected.shortcuts.type = network.type.toString();

        const val = await getBalance(currentlySelected.shortcuts.network.chainId, currentlySelected.shortcuts.address);
        $yakklCurrentlySelectedStore.shortcuts.value = val ?? 0n;

        if (!isEncryptedData(currentlySelected.data)) {
          const encryptedData = await encryptData(currentlySelected.data, yakklMiscStore);
          currentlySelected.data = encryptedData;
        }
        
        await setYakklCurrentlySelectedStorage(currentlySelected);

        updateValuePriceFiat();
        goto(PATH_WELCOME);  // For combo box to update properly
      }
    } catch (e) {
      console.log(e);
      errorValue = e as string;
      error = true;
    }
  }

  async function getBalance(chainId: number, address: string): Promise<bigint | null> {
    try {
      if (chainId) {
        await wallet.setChainId(chainId);
        const val = await wallet.getBalance(address);
        return val;
      }
      return null;
    } catch (e) {
      console.log(e);
      errorValue = e as string;
      error = true;
      return null;
    }
  }

  const { form, errors, state, isValid, handleChange, handleSubmit } = createForm({
    initialValues: { email: "" },
    validationSchema: yup.object().shape({
      email: yup.string().email('Must be a valid email.').required('Email is required.'),
    }),
    onSubmit: data => {
      try {
        // DURING BETA TESTING!
        //handleUpgrade(data.email);
      } catch (e) {
        errorValue = `Following error occurred: ${e}`;
        console.log(errorValue);
      }
    }
  });

  async function handleUpgrade(email: string) {
    try {
      if (!getUserName(email)) {
        console.log('Username has not been defined yet.');
        return;
      }

      let key = await getRegistrationKey(email);
      if (key === '' && userName) {
        handleOpenInTab(encodeURI("https://buy.stripe.com/test_28oaHm7Jt9lS9LqeUU?prefilled_promo_code=" + promoCode + "&client_reference_id=" + userName + "&prefilled_email=" + email + "&utm_source=yakkl&utm_medium=product&utm_campaign=" + promoCode));
      } else {
        console.log('Unable to return registration key.');
        throw 'Unable to return registration key.';
      }
      step1 = true;
      upgrade = true;
    } catch (e) {
      console.log(e);
    }
  }

  async function handleUpgradeSave() {
    try {
      if (!yakklMiscStore) {
        console.log('Username and/or password have not been defined at this time.');
        return undefined;
      }
      await getProfile().then(async result => {
        let profile = result as Profile;

        if (isEncryptedData(profile.data)) {
          await decryptData(profile.data, yakklMiscStore).then(async (result) => {
            profile.data = result as ProfileData;
            profile.data.registered.type = RegistrationType.PREMIER;
            profile.data.registered.key = serialNumber;
            yakklVersionStore.set('Premier - ' + serialNumber);

            await encryptData(profile.data, yakklMiscStore).then(async (result) => {
              profile.data = result;
              await setProfileStorage(profile);
            });
          });
        }
      });

      await getSettings().then(async result => {
        yakklSettings = result as Settings;
        yakklSettings.registeredType = RegistrationType.PREMIER;
        await setSettings(yakklSettings);
      });
      upgrade = false;
    } catch (e) {
      console.log(e);
    }
  }

  function handleCopy(e: any) {
    toastTrigger(3, 'Copied to clipboard');
    timeoutClipboard(5);
  }

  function formatEther(value: BigNumberish): string {
    const val = EthereumBigNumber.from(value);        
    // Convert from Wei to Ether and get string representation
    return val.toEtherString();
  }

</script>


<ErrorNoAction bind:show={error} bind:value={errorValue} title="ERROR!"/>

{#await $yakklAccountsStore}
<p>o_o</p>
{:then _}
{#if $yakklAccountsStore != undefined}
<Accounts bind:show={showAccountsModal} onAccountSelect={handleAccounts} className="text-gray-600"/>
<!-- <Modal title="Account List" bind:open={showAccountsModal} size="xs" class="p-2 overflow-x-auto" autoclose> 
  <p class="text-sm font-normal text-gray-500 dark:text-gray-400">Select the account you wish to make current</p>
  <ul class="-mx-2">
    {#each $yakklAccountsStore as account, i}
    {#if account.accountType === AccountTypeCategory.PRIMARY}
    <li class="my-2">
      <a role="button" on:click|preventDefault={() => handleAccounts(account)} class="flex items-center text-base-content bg-primary rounded-lg hover:bg-primary-focus group hover:shadow">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="w-6 h-6" fill="none" viewBox="-161.97 -439.65 1403.74 2637.9">
          <path fill="#8A92B2" d="M539.7 650.3V0L0 895.6z"/>
          <path fill="#62688F" d="M539.7 1214.7V650.3L0 895.6zm0-564.4l539.8 245.3L539.7 0z"/>
          <path fill="#454A75" d="M539.7 650.3v564.4l539.8-319.1z"/>
          <path fill="#8A92B2" d="M539.7 1316.9L0 998l539.7 760.6z"/>
          <path fill="#62688F" d="M1079.8 998l-540.1 318.9v441.7z"/>
        </svg>
        <div class="flex flex-1 flex-col ml-1 text-base-content">
          <span class="text-sm font-bold">PORTFOLIO</span>
          <div class="flex flex-row">
            <span id='p{i}' class="text-sm font-bold text-left">{account.name}</span>
          </div>
          <span class="text-xs font-semibold">{account.address}</span>
        </div>
      </a>
    </li>
    {:else if account.accountType === AccountTypeCategory.SUB}
    <li class="my-2 ml-2">
      <a role="button" on:click|preventDefault={() => handleAccounts(account)} class="flex items-center text-base-content bg-secondary rounded-lg hover:bg-secondary-focus group hover:shadow">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="w-6 h-6" fill="none" viewBox="-161.97 -439.65 1403.74 2637.9">
          <path fill="#8A92B2" d="M539.7 650.3V0L0 895.6z"/>
          <path fill="#62688F" d="M539.7 1214.7V650.3L0 895.6zm0-564.4l539.8 245.3L539.7 0z"/>
          <path fill="#454A75" d="M539.7 650.3v564.4l539.8-319.1z"/>
          <path fill="#8A92B2" d="M539.7 1316.9L0 998l539.7 760.6z"/>
          <path fill="#62688F" d="M1079.8 998l-540.1 318.9v441.7z"/>
        </svg>
        <div class="flex flex-1 flex-col ml-1 text-base-content">
          <span class="text-sm font-bold">SUB-PORTFOLIO</span>
          <div class="flex flex-row">
            <span id='p{i}' class="text-sm font-bold text-left">{account.name}</span>
          </div>
          <span class="text-xs font-semibold">{account.address}</span>
        </div>
      </a>
    </li>
    {:else}
    <li class="my-2">
      <a role="button" on:click|preventDefault={() => handleAccounts(account)} class="flex items-center text-base-content bg-accent rounded-lg hover:bg-accent-focus group hover:shadow">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="w-6 h-6" fill="none" viewBox="-161.97 -439.65 1403.74 2637.9">
          <path fill="#8A92B2" d="M539.7 650.3V0L0 895.6z"/>
          <path fill="#62688F" d="M539.7 1214.7V650.3L0 895.6zm0-564.4l539.8 245.3L539.7 0z"/>
          <path fill="#454A75" d="M539.7 650.3v564.4l539.8-319.1z"/>
          <path fill="#8A92B2" d="M539.7 1316.9L0 998l539.7 760.6z"/>
          <path fill="#62688F" d="M1079.8 998l-540.1 318.9v441.7z"/>
        </svg>
        <div class="flex flex-1 flex-col ml-1 text-base-content">
          <span class="text-sm font-bold">IMPORTED</span>
          <div class="flex flex-row">
            <span class="text-sm font-bold text-left">{account.name}</span>
          </div>
          <span id='s{i}' class="text-xs font-semibold">{account.address}</span>
        </div>
      </a>
    </li>
    {/if}
    {/each}
    {#if $yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.address === YAKKL_ZERO_ADDRESS}
    <p class="text-lg font-bold">There are no Portfolio Accounts to display! Create at least one Portfolio account!</p>
    {/if}
  </ul>
  <svelte:fragment slot='footer'>
    <p class="text-sm font-normal text-gray-500 dark:text-gray-400">Whatever account you select will become your <span class="border-b-2 underline underline-offset-8">active</span> account!</p>
  </svelte:fragment>
</Modal> -->

<Modal title="Contact List" bind:open={showContacts} size="xs" class="p-4">
  <p class="text-sm font-normal text-gray-700 dark:text-gray-400">List of contacts</p>
  {#if $yakklContactsStore}
  <ul class="my-4 space-y-3">
    {#each $yakklContactsStore as contact}
    <li class="my-2">
      <div class="flex items-center p-2 text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="w-6 h-6" fill="none" viewBox="-161.97 -439.65 1403.74 2637.9">
          <path fill="#8A92B2" d="M539.7 650.3V0L0 895.6z"/>
          <path fill="#62688F" d="M539.7 1214.7V650.3L0 895.6zm0-564.4l539.8 245.3L539.7 0z"/>
          <path fill="#454A75" d="M539.7 650.3v564.4l539.8-319.1z"/>
          <path fill="#8A92B2" d="M539.7 1316.9L0 998l539.7 760.6z"/>
          <path fill="#62688F" d="M1079.8 998l-540.1 318.9v441.7z"/>
        </svg>
        <div class="flex flex-1 flex-col ml-2">
          <span class="text-sm font-bold">{contact.name}</span>
          <span class="text-xs font-mono">{contact.address}</span>
          <span class="text-xs font-mono">{contact.alias}</span>
          <span class="text-xs font-mono">{contact.note}</span>
        </div>
      </div>
    </li>
    {/each}
  </ul>
  {:else}
  <div class="text-center text-md text-gray-700 dark:text-gray-400">
    There are currently no contacts! You can add contacts in the 'Accounts' area.
  </div>
  {/if}
</Modal>

<Modal title="Receive" bind:open={showRecv} size="xs" class="xs" color="default"> 
  <div class="text-center prose">
    <div class="mb-4">
      {#if $yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.address !== YAKKL_ZERO_ADDRESS}
      <QR qrText={address}/>
      {:else}
      <p class="text-lg font-bold">There are no Portfolio Accounts to display! Create at least one Portfolio account!</p>      
      {/if}
    </div>

    {#if $yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.address !== YAKKL_ZERO_ADDRESS}
    <div class="border border-base-300 rounded-lg w-full mb-2 p-2 ">
      <p class="text-xs font-semibold text-gray-800 dark:text-white" data-bs-toggle="tooltip" data-bs-placement="top" title={address}>{address}
        <button class="clip w-4 h-4 ml-1 mt-0.5" data-clipboard-action="copy" data-clipboard-target="#pkey1" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy Address!">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-base-300 hover:stroke-base-100 dark:stroke-white" fill="none" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </button>
        <input id="pkey1" value=":yakkl:{address}" type="hidden">
      </p>
    </div>
    {/if}
    <Button on:click={() => {showRecv=false}}>Close</Button>
  </div>
  <svelte:fragment slot='footer'>
    <p class="text-sm font-normal">Scan the barcode for your mobile device or click the copy button so you can paste it.</p>
  </svelte:fragment>
</Modal>

<Modal title="Upgrade to Premier" bind:open={upgrade} size="xs" class="xs" color="purple"> 
  <div class="text-center m-2">
    {#if !step1}
    <div id="step1" class="border border-purple-500 rounded-lg w-full mb-2 p-2 ">
      <form class="w-full" on:submit|preventDefault={handleSubmit}>
        <div class="pt-1 item-center w-full text-left mb-2">
          <span class="text-md text-purple-800 font-bold text-left mt-2 mb-1">Email required for upgrading:*</span>
          <input id="email"
              class="w-full px-3 md:py-2 py-1 text-lg font-normal text-gray-700 bg-gray-100  border border-solid border-gray-300 transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
              placeholder="Email" 
              autocomplete="off" 
              bind:value="{$form.email}"
              on:change="{handleChange}" 
              aria-label="Email" 
              required />
          {#if $errors.email}
          <small class="text-red-600 font-bold animate-pulse">{$errors.email}</small>
          {/if}

          <p class="text-md font-normal">Step 1. <span class="font-bold">Email is required for LATER billing.</span> Entering it here will automatically prefill the billing page (browser window). Billing is handled by Stripe and billing data is maintained there as well. Once you do that you can remove it, but the vendor requires it.</p>
          {#if promoCode === 'IYO'}
          <p class="text-md text-red">NOTE: The <span class="font-bold">IYO</span> promo code is being automatically passed to the processor. This means you get the Premier version for FREE because you're participating in our BETA release. Stripe, our processor, will prompt for a credit/debit card even though there will be NO CHARGE! This is for the annual recurring billing of $29.99. You can cancel that at any time.</p>
          {/if}
        </div>
        <div class="mb-2">
          <Button type="submit" id="continue">1. Continue 
            <span class="ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>              
            </span>
          </Button>
        </div>
      </form>
    </div>
    {/if}

    {#if step1}
    <div id="step2" class="border border-primary rounded-lg w-full my-2 p-2 ">
      <form class="w-full" on:submit|preventDefault={handleUpgradeSave}>
        <div class="pt-1 item-center w-full text-left">
        <span class="text-md text-purple-800 font-bold text-left mt-2 mb-1">Premier Serial Number:*</span>
        <input id="serialNumber"
            class="w-full px-3 md:py-2 py-1 text-lg font-normal text-gray-700 bg-gray-100  border border-solid border-gray-300 transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            placeholder="Serial Number" autocomplete="off" bind:value="{serialNumber}" aria-label="Serial Number" required />
        <p class="text-md font-normal">Step 2 (Final). After entering the billing information in the browser window, a serial number will be generated and emailed to you. Copy that value and paste it in the Registration Dialog that will popup prompting for the registration key. Click complete and that's it!</p>
        </div>
        <div class="mb-2">
          <Button type="submit" id="complete" >2. Complete</Button>
        </div>
      </form>
    </div>
    {/if}
  </div>
  <svelte:fragment slot='footer'>
    <p class="text-lg font-bold">Great choice!</p>
    <p class="text-sm font-normal">A number of advanced features can be unlocked by upgrading to Premier. Copy the serial number from the website (after completing the purchase) and paste it into the serial number field above and save. That's it!</p>
  </svelte:fragment>
</Modal>
{/if}
{/await}



<Toast color="green" transition={slide} bind:toastStatus>
  <svelte:fragment slot="icon">
    {#if toastType === 'success'}
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {/if}
  </svelte:fragment>
  {toastMessage}
</Toast>



<div class="visible print:hidden relative top-0 mx-2">
  <div style="z-index: 4; background-image: url('/images/{card}'); " class="visible print:hidden relative m-2 ml-0 mr-0 h-[261px] rounded-xl">
    <div class="grid grid-rows-5 gap-1 h-full">
      <div class="absolute left-4 bottom-1">
        <span class="text-gray-100 text-lg">Asset Price:</span>
        <span class="ml-2 text-gray-100 text-lg">{assetPrice} {currencyLabel}</span>
      </div>

      <SpeedDial defaultClass="absolute right-1 bottom-1 z-10 bg-primary rounded-full" pill={false} tooltip="none" placement='bottom'>
        <svg slot="icon" aria-hidden="true" class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
        <SpeedDialButton name="Accounts" on:click={() => {showAccountsModal = true}} btnDefaultClass="w-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true" class="w-6 h-6" fill="currentColor">
            <path fill-rule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Contacts" on:click={() => {showContacts = true}} btnDefaultClass="w-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true" class="w-6 h-6" fill="currentColor">
            <path fill-rule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Receive" on:click={() => {showRecv=true}} btnDefaultClass="w-16">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
            <path fill-rule="evenodd" d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zM6 6.75A.75.75 0 016.75 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75A.75.75 0 016 7.5v-.75zm9.75 0A.75.75 0 0116.5 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 19.125v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875-.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM6 16.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm9.75 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm-3 3a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75z" clip-rule="evenodd" />          
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Logout" on:click={() => goto(PATH_LOCK)} btnDefaultClass="w-16">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h10.5A2.25 2.25 0 0118 4.25v10.5A2.25 2.25 0 0115.75 18h-10.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M8.704 10.943l1.048.943H3.75a.75.75 0 000 1.5h6.002l-1.048.943a.75.75 0 101.004 1.114l2.5-2.25a.75.75 0 000-1.114l-2.5-2.25a.75.75 0 10-1.004 1.114z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton> 
        <SpeedDialButton name="EXIT" on:click={() => goto(PATH_LOGOUT)} btnDefaultClass="w-16">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd" />
          </svg>            
        </SpeedDialButton> 
      </SpeedDial>

      <nav id="{id}" class="print:hidden visible relative row-span-1 inset-x-0 navbar navbar-expand-sm p-2 flex items-center w-full justify-between">
        <div class="flex text-center justify-left w-[410px]">
          <span class="text-gray-100 text-center dark:text-white text-4xl ml-2 -mt-6 font-bold">{$yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.network.blockchain}</span>
          {#if showTestNetworks}        
          <span class="flex h-6 absolute top-2 right-8">
            <div class="dropdown dropdown-bottom">
              {#if networkLabel.toLowerCase() === 'mainnet'} 
              <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label tabindex="0" role="button" class="w-28 px-3 py-1 bg-red-800/80 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg active:text-white transition duration-150 ease-in-out flex items-center whitespace-nowrap">LIVE-{networkLabel}</label>
              {:else}
              <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label tabindex="0" role="button" class="w-28 px-3 py-1 bg-green-800/80 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg active:text-white transition duration-150 ease-in-out flex items-center whitespace-nowrap">Test-{networkLabel}</label>
              {/if}
              <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
              <ul tabindex="0" class="dropdown-content menu bg-opacity-90 text-base z-50 float-left py-2 list-none text-left rounded-lg shadow-lg mt-1 m-0 bg-clip-padding border-none bg-gray-800">
                {#each networks as network}
                <li>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <!-- svelte-ignore a11y-interactive-supports-focus -->
                  <div role="button" on:click|preventDefault={() => handleNetworkTypeChange(network)} class="dropdown-item text-sm py-2 px-4 font-normal w-full whitespace-nowrap bg-transparent text-gray-300 hover:bg-gray-500 hover:text-white focus:text-white focus:bg-gray-700">
                    {#if network.type === NetworkType.MAINNET}
                    LIVE-{network.name}
                    {:else}
                    Test-{network.name}
                    {/if}
                  </div>
                </li>
                {/each}
              </ul>
            </div>
          </span>
          {:else}
          <span class="flex h-6 absolute top-2 right-8">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label class="w-28 px-3 py-1 bg-red-800/80 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg active:text-white transition duration-150 ease-in-out flex items-center whitespace-nowrap">LIVE-{networkLabel}</label>
          </span>
          {/if}
        </div>
      </nav>

      <div class="ml-4">
        <div class="row-span-2 -mt-4">
          <p class="text-gray-100 dark:text-white text-lg">Account:</p>
          <p class="text-gray-100 dark:text-white text-lg ml-4 -mt-1" data-bs-toggle="tooltip" data-bs-placement="top" title={name}>Name: <span class="uppercase ml-5">{nameShow}</span></p> 
          <p class="text-gray-100 dark:text-white text-lg ml-4 -mt-2" data-bs-toggle="tooltip" data-bs-placement="top" title={address}>Number: <span class="ml-1">{addressShow}</span>
            <button id="copy" on:click|preventDefault={handleCopy} class="clip w-6 h-6 ml-1 mt-0.5 hover:text-gray-500" data-clipboard-action="copy" data-clipboard-target="#paddress" data-yakkl-copy="yakkl">  
              <svg id="copy2" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 dark:text-white hover:stroke-gray-200" data-yakkl-copy="yakkl" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
            <input id="paddress" name="address" value=":yakkl:{address}" type="hidden" data-yakkl-copy="yakkl">
          </p>
        </div>
        <div class="absolute top-[118px] left-[175px] opacity-25 -z-10">
          {#if symbolLabel}
          <svg width="60" height="60" fill="none" viewBox="0 0 60 60">
            <g clip-path="url(#j)">
              <rect width="60" height="60" rx="30" fill="#987DE8" />
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="m15.48 28.367 11.966-19.3c1.174-1.892 3.927-1.892 5.1 0l11.97 19.306a6 6 0 0 1 .9 3.142v.028a6 6 0 0 1-1.154 3.56L33.227 50.208c-1.599 2.188-4.864 2.188-6.461 0L15.733 35.095a6 6 0 0 1-1.154-3.538v-.029a6 6 0 0 1 .9-3.161Z"
                fill="#fff"
              />
              <path
                d="M30.84 10.112a.992.992 0 0 0-.844-.464V24.5l12.598 5.53c.081-.466-.001-.963-.27-1.398L30.84 10.112Z"
                fill="#643CDD"
              />
              <path
                d="M29.996 9.648a.991.991 0 0 0-.845.465l-11.489 18.53a1.991 1.991 0 0 0-.264 1.387l12.598-5.53V9.648Z"
                fill="#BDADEB"
              />
              <path
                d="M29.996 50.544a.994.994 0 0 0 .808-.41l11.235-15.38c.307-.434-.193-.988-.658-.72L31.49 39.71a2.998 2.998 0 0 1-1.494.398v10.437Z"
                fill="#643CDD"
              />
              <path
                d="M17.966 34.762 29.19 50.134c.2.274.503.41.807.41V40.108a2.998 2.998 0 0 1-1.493-.398l-9.884-5.676c-.468-.27-.971.292-.653.728Z"
                fill="#BDADEB"
              />
              <path
                d="M42.594 30.03 29.996 24.5v13.138a3 3 0 0 0 1.495-.399l10.149-5.83c.525-.31.856-.823.954-1.38Z"
                fill="#401AB3"
              />
              <path
                d="M29.996 37.638V24.462l-12.598 5.566c.098.564.437 1.083.974 1.392l10.13 5.82c.462.265.978.398 1.494.398Z"
                fill="#7C5AE2"
              />
            </g>
            <rect class="help-img-highlight" x=".5" y=".5" width="59" height="59" rx="29.5" />
            <defs>
              <clipPath id="j"><rect width="60" height="60" rx="30" fill="#fff" /></clipPath>
            </defs>
          </svg>
          {/if}
        </div>

        <div class="flex text-xl justify-center mt-4 text-gray-100 dark:text-white row-span-1">
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="{shortcutsValue.toEtherString()}">{formattedEtherValue}</span>
          <span class="ml-2">{symbolLabel}</span>
        </div>

        <div class="flex justify-center text-lg text-gray-100 dark:text-white -mt-1 row-span-1 -ml-[2.3rem]">
          <span>
            {#if direction === 'up'}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 fill-green-500 font-bold">
              <path fill-rule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l3.75 3.75a.75.75 0 01-1.06 1.06l-2.47-2.47V21a.75.75 0 01-1.5 0V4.81L8.78 7.28a.75.75 0 01-1.06-1.06l3.75-3.75z" clip-rule="evenodd" />
            </svg>
            {:else if direction === 'dn'}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 fill-red-500 font-bold">
              <path fill-rule="evenodd" d="M12 2.25a.75.75 0 01.75.75v16.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0l-3.75-3.75a.75.75 0 111.06-1.06l2.47 2.47V3a.75.75 0 01.75-.75z" clip-rule="evenodd" />
            </svg>
            {/if}
          </span>
          <span class="">{valueFiat}</span>
          <span class="ml-2">{currencyLabel}</span>
        </div>
      </div>
    </div>
  </div>
  <div style="z-index: 1;" class="grid w-[381px] left-[18.5px] bottom-[5px] h-[10px] absolute rounded bg-secondary text-accent-content place-content-center"></div> 
  <div style="z-index: 0;" class="grid w-[366px] left-[27px] bottom-[2.5px] h-[10px] absolute rounded bg-accent text-secondary-content place-content-center"></div>
</div>
