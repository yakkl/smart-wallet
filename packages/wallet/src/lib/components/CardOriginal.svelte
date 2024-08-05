<script lang="ts">

  import { goto } from '$app/navigation';
  import { browser as browserSvelte } from '$app/environment';
  import { createForm } from "svelte-forms-lib";
  import * as yup from 'yup';
  import { Modal, Button, SpeedDial, SpeedDialButton } from 'flowbite-svelte';
  import { setSettings, getProfile, getSettings, yakklVersionStore, yakklPricingStore, yakklUserNameStore, getYakklPrimaryAccounts, getYakklAccounts, getYakklContacts, setYakklCurrentlySelectedStorage, setYakklAccountsStorage, setProfileStorage, getYakklCurrentlySelected, getMiscStore, yakklCurrentlySelectedStore, setYakklContactsStore, yakklAccountsStore, yakklContactsStore } from '$lib/common/stores';
  import {PATH_WELCOME, YAKKL_ZERO_ADDRESS, PATH_LOGOUT, PATH_LOCK } from '$lib/common/constants';
  import ClipboardJS from 'clipboard'; 
  import QR from '$lib/components/QR.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { truncate, handleOpenInTab, deepCopy, formatValue, timeoutClipboard, checkUpgrade } from "$lib/utilities/utilities";
  import { encryptData, decryptData } from '$lib/common/encryption';
  
  import { startCheckPrices, stopCheckPrices, getPricesCoinbase } from '$lib/tokens/prices';
  import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
	import { AccountTypeCategory, BigNumber, NetworkType, RegistrationType, isEncryptedData, type CurrentlySelectedData, type Network, type Profile, type ProfileData, type Settings, type YakklAccount, type YakklContact, type YakklCurrentlySelected, type YakklPrimaryAccount } from '$lib/common';
  import type { BigNumberish } from '$lib/common/bignumber';

  // Toast
  import { Toast } from 'flowbite-svelte';
  import { slide } from 'svelte/transition';  
  // Toast

  import WalletManager from '$lib/plugins/WalletManager';
  import { Wallet } from '$lib/plugins/Wallet';
	import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
	
  export let id = "card"; // See html below...

  let wallet: Wallet;
  let networks: Network[] = []; // Each blockchain will have its own network list (contains chainId, name, type, blockchain, etc.)

  let networkLabel = 'Mainnet'; // Default
  let addressShow: string;
  let address: string;
  let name: string;
  let nameShow: string;
  let value: EthereumBigNumber = new EthereumBigNumber(0);
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
  let assetPriceValue: number = 0;
  let assetPrice: string = '';
  let card = 'ethereum-background.png';
  let clipboard: ClipboardJS;

  let currentlySelected: YakklCurrentlySelected | null = null;
  let yakklMiscStore: string = getMiscStore();
  let symbolLabel: string;
  let currencyLabel: string;
  let currency: Intl.NumberFormat;
  let shortcutsValue: BigNumber = BigNumber.from(0);
  // let cardValue: BigNumber = BigNumber.from(0);
  let chainId: number = 1;

  //////// Toast
  let toastShow = false;
  let toastCounter = 4;
  let toastMessage = 'Success';
  let toastType = 'success'; // 'success', 'warning', 'error'

  function toastTrigger(count=4, msg='Success') {
    toastShow = true;
    toastCounter = count;
    toastMessage = msg;
    timeout();
  }

  function timeout(): NodeJS.Timeout | void {
    if (--toastCounter > 0)
      return setTimeout(timeout, 1000);
    toastShow = false;
  }
  //////// Toast


  // async function initialize() {
  //   if (!currentlySelected) {
  //     currentlySelected = await getYakklCurrentlySelected();  // This drives most things for the currently selected account and chain
  //   }
  //   $yakklCurrentlySelectedStore = deepCopy(currentlySelected);
  //   yakklMiscStore = getMiscStore();
    
  //   currencyLabel = currentlySelected.preferences.currency.code ?? 'USD';
  //   currency = Intl.NumberFormat('en-US', {style: "currency", currency: currencyLabel});
  //   symbolLabel = currentlySelected.shortcuts.symbol ?? 'ETH';

  //   if (!wallet) wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], currentlySelected.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM_PROD);

  //   $yakklAccountsStore = await getYakklAccounts();
  //   $yakklContactsStore = await getYakklContacts();
  // }

  // (async () => {
  //   await initialize();
  // })();

  $: { 
    try {
    // May can structure the blockchain, chainId, address, and temporary value in a single object held as a map that is processed in the background. This would keep values updated everywhere
      assetPriceValue = $yakklPricingStore?.price ?? 0n;

      console.log('Card: currentlySelected $$', currentlySelected);
      console.log('Card: yakklPricingStore $$', $yakklPricingStore);
      console.log('Card: assetPriceValue $$', assetPriceValue);

      assetPrice = currency ? currency.format(assetPriceValue) : '0.00';
      console.log('Card: assetPrice $$', assetPrice);

      networkLabel = $yakklCurrentlySelectedStore ? $yakklCurrentlySelectedStore.shortcuts.network.name : 'Mainnet';

      console.log('Card: networkLabel', networkLabel);
      console.log('Card: $yakklCurrentlySelectedStore', $yakklCurrentlySelectedStore);

      shortcutsValue.value = $yakklCurrentlySelectedStore ? $yakklCurrentlySelectedStore.shortcuts.value : 0n;
      chainId = $yakklCurrentlySelectedStore ? $yakklCurrentlySelectedStore.shortcuts.network.chainId : 1;
      // startPricingChecks(); // this when or if we want to make sure the value is > 0
      startCheckPrices(checkPricesProvider, checkPricesInterval);

      updateValuePriceFiat();
    } catch (e) {
      console.log(e);
    }
  }

  function startPricingChecks() {
    const numValue = shortcutsValue.toNumber();

    if (numValue !== null && numValue > 0) {
      startCheckPrices(checkPricesProvider, checkPricesInterval);
    } else {
      stopCheckPrices();
    }
  }

  onMount(async () => {
    try {
      if (browserSvelte) {
        if (!currentlySelected) currentlySelected = await getYakklCurrentlySelected();  // This drives most things for the currently selected account and chain
        if (!yakklMiscStore) yakklMiscStore = getMiscStore();

        console.log('onMount: $yakklCurrentlySelectedStore1:', $yakklCurrentlySelectedStore);
        $yakklCurrentlySelectedStore = deepCopy(currentlySelected);
        console.log('onMount: $yakklCurrentlySelectedStore2:', $yakklCurrentlySelectedStore);
        
        currencyLabel = currentlySelected.preferences.currency.code ?? 'USD';
        currency = Intl.NumberFormat('en-US', {style: "currency", currency: currencyLabel});
        symbolLabel = currentlySelected.shortcuts.symbol ?? 'ETH';

        chainId = $yakklCurrentlySelectedStore!.shortcuts.network.chainId ?? 1;        
        wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], chainId, import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM_PROD);
        networks = wallet.getBlockchain().getNetworks();
        console.log('onMount: networks:', networks);

        $yakklContactsStore = await getYakklContacts();
        
        await updateValuePriceFiat();
        await getAccounts();
  
        clipboard = new ClipboardJS('.clip');

        updateUpgradeButton();
        // handleInit();
        startPricingChecks();
      }
    } catch (e) {
      console.log(`onMount: ${e}`);      
    }
  });
  
  onDestroy(async () => {
    if (currentlySelected !== null) {
      await setYakklCurrentlySelectedStorage(currentlySelected);
      $yakklCurrentlySelectedStore = deepCopy(currentlySelected);
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

  // function handleInit() {
  //   if (currentlySelected !== null) currentlySelected.shortcuts.value = 0n;
  //   value = $yakklCurrentlySelectedStore!.shortcuts.value = 0n;
  //   valueFiat = '0.00';
  //   updateValuePriceFiat();
  //   // handleNetworkTypeChange('');
  // }

  async function updateValuePriceFiat(): Promise<void> {
    try {
      if (currentlySelected === null || currentlySelected === undefined) {
        currentlySelected = await getYakklCurrentlySelected();
        if (currentlySelected === null) throw 'No account selected.';
      }

      $yakklCurrentlySelectedStore = deepCopy(currentlySelected);
      // let id: string = currentlySelected?.id ?? yakklSettings.id;
      console.log('updateValuePriceFiat:', $yakklCurrentlySelectedStore);

      if (currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS) {
        currentlySelected.shortcuts.value = $yakklCurrentlySelectedStore!.shortcuts.value = 0n;
        return;
      }

      if (currentlySelected.shortcuts.value === 0n || currentlySelected.shortcuts.value === undefined) {
        currentlySelected.shortcuts.value = 0n;
      }

      //temp comment on next line
      if (currentlySelected.shortcuts.address ) { //&& currentlySelected.shortcuts.value > 0n) {
        startCheckPrices(checkPricesProvider, checkPricesInterval);
        if (!$yakklPricingStore?.price) {
          // This will act as a temporary call until the pricing interval checks start in the background
          await getPricesCoinbase('eth-usd').then(results => {
            yakklPricingStore.set({provider: checkPricesProvider, id: '-1', pair: 'ETH/USD', price: results.price}); // -1 for id means one off pricing and not on an interval
          });
        }

        $yakklCurrentlySelectedStore!.shortcuts.value = currentlySelected.shortcuts.value; 

        value = EthereumBigNumber.from(currentlySelected.shortcuts.value);

        console.log('updateValuePriceFiat: value:', value);

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
          direction = 'fl';
        }

        prevPrice = price;
        let newValue: number = value.toNumber() as number;
        console.log('updateValuePriceFiat: newValue:', newValue);
        valueFiat = currency.format(newValue * price);
        console.log('updateValuePriceFiat: valueFiat:', valueFiat);
      } else {
        value = EthereumBigNumber.from(0);
        valueFiat = '0.00';
        stopCheckPrices();
      }
    } catch(e) {
      console.log(`updateValuePriceFiat: ${e}`);
    }
    updateCurrentlySelected();
  }

  // Three ways this is called - 1. Account changed while on the same network 2. Network changed while same coin 3. New coin and mainnet
  async function updateCurrentlySelected() {
    try {
      if (currentlySelected === null) {
        currentlySelected = await getYakklCurrentlySelected();
        if (currentlySelected === null) throw 'No account selected.';
      }
      $yakklCurrentlySelectedStore = deepCopy(currentlySelected);
      
      address = currentlySelected.shortcuts.address;
      addressShow = truncate(currentlySelected.shortcuts.address, 6) + address.substring(address.length - 4);
      name = currentlySelected.shortcuts.accountName;
      currencyLabel = currentlySelected.preferences.currency.code ?? 'USD';

      if (address === YAKKL_ZERO_ADDRESS) {
        nameShow = '0x0000...0000';
      } else {
        nameShow = truncate(name, 20);
      }
    } catch (e) {
      console.log(`updateCurrentlySelected: ${e}`);
    }
  }

  async function getAccounts(): Promise<void> {
    try {
      if (currentlySelected === null) {
        $yakklCurrentlySelectedStore = currentlySelected = await getYakklCurrentlySelected();
        if (currentlySelected === null) throw 'No account selected.';
      }
      if (currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS) {
        return;
      }

      let contacts = await getYakklContacts();
      setYakklContactsStore(contacts);

      let accounts = await getYakklAccounts();
      let updatedAccounts: YakklAccount[] = [];

      for (let account of accounts) {
        let value = await wallet.getBalance(account.address) ?? 0n;
        account.value = value;
        updatedAccounts.push(account);
      };

      $yakklAccountsStore = updatedAccounts ? updatedAccounts : accounts;
      if (updatedAccounts.length > 0) {        
        console.log('getAccounts: $yakklAccountsStore:', $yakklAccountsStore);

        await setYakklAccountsStorage(updatedAccounts); // This will update the store too
      }
    } catch(e) {
      console.log(`getAccounts: ${e}`); 
    }
  }

  async function getUserName(email: string) {
    try {
      console.log('getUserName:', email);

      if ($yakklUserNameStore) {
        userName = $yakklUserNameStore;
        return $yakklUserNameStore;
      }

      if (!yakklMiscStore) {
        return undefined;
      }
       
      await getProfile().then(async result => {
        let profile = result as Profile;
      
        if (isEncryptedData(profile.data)) {
          await decryptData(profile.data, yakklMiscStore).then(async (result) => {
            profile.data = result as ProfileData;
            userName = profile.userName;
            $yakklUserNameStore = userName;
          });
        } else {
          userName = profile.userName;
          $yakklUserNameStore = userName;
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

            if (key !== '' && regType !== RegistrationType.STANDARD) {
              return Promise.resolve(key);
            } else {
              return Promise.reject(undefined);;
            }
          });
        }
      } else {
        return Promise.reject(undefined);;
      }
    } catch (e) {
      console.log(`getRegistrationKey: ${e}`);    
      throw e;
    }
    return Promise.reject(undefined);;
  }

  
  // Newly selected account
  async function handleAccounts(account: YakklAccount) {
    try {      
      if (currentlySelected === null) {
        currentlySelected = await getYakklCurrentlySelected();
        if (currentlySelected === null) throw 'No account selected.';
      }

      if (currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS) {
        return;
      }

      if (isEncryptedData(currentlySelected.data)) {
        await decryptData(currentlySelected.data, yakklMiscStore).then(async (result) => {
          (currentlySelected as YakklCurrentlySelected).data = result as CurrentlySelectedData;
        });
      }

      console.log('handleAccounts: Account selected:', account);  

      currentlySelected.shortcuts.accountType = account.accountType;
      currentlySelected.shortcuts.address = account.address;
      currentlySelected.shortcuts.primary = account.primaryAccount;
      // Gets the balance in handleNetworkTypeChange function below
      
      console.log('currentlySelected.shortcuts.value:', currentlySelected.shortcuts.value);
      console.log('account.value:', account.value);

      currentlySelected.shortcuts.value = account.value !== null ? account.value : 0n; 
      currentlySelected.shortcuts.accountName = account.name;

      if (account.accountType === AccountTypeCategory.PRIMARY) {
        // Look up primary
        let primaryAccounts = await getYakklPrimaryAccounts();
        let primaryAccount = primaryAccounts.find(primary => primary.address === account.address);
        (currentlySelected.data as CurrentlySelectedData).primaryAccount = primaryAccount as YakklPrimaryAccount;  // TODO: May want to change this to a boolean instead of the actual account
      }
      
      (currentlySelected.data as CurrentlySelectedData).account = account;
      $yakklCurrentlySelectedStore = deepCopy(currentlySelected);

      console.log('handleAccounts: $yakklCurrentlySelectedStore 1:', $yakklCurrentlySelectedStore);

      await getBalance(currentlySelected.shortcuts.chainId, currentlySelected.shortcuts.address); // This will update the value in the store/storage

      console.log('handleAccounts: $yakklCurrentlySelectedStore 2:', $yakklCurrentlySelectedStore);

      // Update the Card info
      await updateValuePriceFiat();
    } catch (e) {
      console.log('handleAccounts:',e);
      showAccountsModal = false;
    }
    showAccountsModal = false;
  }

  // function getChainId(blockchain: string, type: string) {
  //   let chainId: number = 1;
  //   let symbol = 'ETH';

  //   switch(blockchain) {
  //     case 
  //   }

  //   return {chainId, symbol};
  // }

  async function handleNetworkTypeChange(network: Network) {
    try {
      if (currentlySelected === null) {
        currentlySelected = await getYakklCurrentlySelected();
        if (currentlySelected === null) throw 'No account selected.';
      }

      if (currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS) {
        return;
      }

      direction = 'fl'; // Set the default to nothing until the values are checked
      currentlySelected.shortcuts.network = network;

      // Legacy - redundant for now
      currentlySelected.shortcuts.chainId = chainId = network.chainId;
      currentlySelected.shortcuts.symbol = network.symbol;
      currentlySelected.shortcuts.type = network.type.toString();

      // if (currentlySelected.shortcuts.network.chainId) {
      //   wallet.setChainId(currentlySelected.shortcuts.network.chainId);
      //   await wallet.getBalance(currentlySelected.shortcuts.address).then(result => {
      //     if (result)
      //       (currentlySelected as YakklCurrentlySelected).shortcuts.value = result;
      //   });
      // }

      await getBalance(currentlySelected.shortcuts.network.chainId, currentlySelected.shortcuts.address); // This will update the value in the store/storage

      console.log('handleNetworkTypeChange: $yakklCurrentlySelectedStore:', $yakklCurrentlySelectedStore);

      let currentDeepCopy: YakklCurrentlySelected = deepCopy(currentlySelected);
      if (!isEncryptedData(currentDeepCopy.data)) {
        encryptData(currentDeepCopy.data, yakklMiscStore).then(result => {
          currentDeepCopy.data = result;
        });
      }
      $yakklCurrentlySelectedStore = currentDeepCopy;
      await setYakklCurrentlySelectedStorage(currentDeepCopy);
      await updateValuePriceFiat();

      // Reset 'send' transactions tabs
      await goto(PATH_WELCOME);
      // updateCurrentlySelected();
    } catch(e) {
      console.log(e); 
      errorValue = e as string;
      error = true;
    }
  }

  async function getBalance(chainId: number, address: string): Promise<BigNumber | undefined> {
    try {
      if (currentlySelected === null) {
        currentlySelected = await getYakklCurrentlySelected();
        if (currentlySelected === null) throw 'No account selected.';
      }

      if (currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS) {
        return; // Just skip and not throw an error
      }

      if (chainId) {
        wallet.setChainId(chainId);
        await wallet.getBalance(address).then(async result => {
          if (result)
            (currentlySelected as YakklCurrentlySelected).shortcuts.value = result;
          await setYakklCurrentlySelectedStorage(currentlySelected!);
          $yakklCurrentlySelectedStore = currentlySelected;
          return result;
        });
      }
      return;
    } catch(e) {
      console.log(e); 
      errorValue = e as string;
      error = true;
    }
  }

  const { form, errors, state, isValid, handleChange, handleSubmit } = createForm({
    initialValues: { email: "" },
    validationSchema: yup.object().shape({
      email: yup  
        .string()
        .email('Must be a valid email.')
        .required('Email is required.'),
    }),
    onSubmit: data => {
      try {
        // DURING BETA TESTING!
        //handleUpgrade(data.email);
      } catch (e) {
        // error = true;
        errorValue = `Following error occurred: ${e}`;
        console.log(errorValue);
      }
    }
  });

  async function handleUpgrade(email: string) {
    try {
      // Collect email
      if (!getUserName(email)) {
        console.log('Username has not been defined yet.');
        return;
      }

      // TBD - May want to look at adding a coupon field so that people can enter who referred them so we can credit that person. The coupon
      //  must be linked to an email or account id so we can properly credit the right person and given them a referral report

      // Launch website with params
      let key = await getRegistrationKey(email);
      if (key === '' && userName) {
        
        
        // TEST ACCOUNT
        handleOpenInTab(encodeURI("https://buy.stripe.com/test_28oaHm7Jt9lS9LqeUU?prefilled_promo_code="+ promoCode +"&client_reference_id="+ userName +"&prefilled_email="+ email +"&utm_source=yakkl&utm_medium=product&utm_campaign="+ promoCode));


      } else {
        console.log('Unable to return registration key.');
        throw 'Unable to return registion key.';
      }
      // If all passes
      step1 = true;
      upgrade = true;
    } catch(e) {
      console.log(e);
    }
  }

  async function handleUpgradeSave() {
    try {
      if (!yakklMiscStore) {
        console.log('Username and/or password have not been defined at this time.');
        return undefined;
      }
      // Verify serial number, open and save
      await getProfile().then(async result => {
        let profile = result as Profile;

        if (isEncryptedData(profile.data)) {
          await decryptData(profile.data, yakklMiscStore).then(async (result) => {
            profile.data = result as ProfileData;
            profile.data.registered.type = RegistrationType.PREMIER;
            profile.data.registered.key = serialNumber;
            $yakklVersionStore = 'Premier - ' + serialNumber;

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

      // Remove upgrade button
      // Change footer version
      // If all passes
      upgrade = false;
    } catch(e) {
      console.log(e);
    } 
  }

  function handleCopy(e: any) {
    toastTrigger(3, 'Copied to clipboard');
    timeoutClipboard(20);
  }

</script>

<ErrorNoAction bind:show={error} bind:value={errorValue} title="ERROR!"/>

<!-- yakklPricingStore -->
 {#await $yakklAccountsStore}
 <p>o_o</p>
 {:then _} 
 {#if $yakklAccountsStore != undefined}

<!-- <AccountsModal hAccounts={handleAccounts} showAccounts={showAccountsModal} /> -->
 <!-- eslint-disable-next-line -->
<!-- <Modal title="Account List" bind:open={showAccountsModal} size="xs" padding="xs" autoclose>  -->
<Modal title="Account List" bind:open={showAccountsModal} size="xs" class="p-4" autoclose> 
  <p class="text-sm font-normal text-gray-500 dark:text-gray-400">Select the account you wish to make current</p>
  <ul class="my-4 space-y-3">
    {#each $yakklAccountsStore as account, i}
    {console.log(`Account: ${i}`, account)}

    <!-- dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white in <a> below -->
    {#if account.accountType === AccountTypeCategory.PRIMARY}
    <li class="my-2">
      <!-- id="d1" -->
      <!-- svelte-ignore a11y-missing-attribute -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <a role="button" on:click|preventDefault={() => handleAccounts(account)} class="flex items-center p-2 text-base-content bg-primary rounded-lg hover:bg-primary-focus group hover:shadow">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="w-6 h-6" fill="none" viewBox="-161.97 -439.65 1403.74 2637.9">
          <path fill="#8A92B2" d="M539.7 650.3V0L0 895.6z"/>
          <path fill="#62688F" d="M539.7 1214.7V650.3L0 895.6zm0-564.4l539.8 245.3L539.7 0z"/>
          <path fill="#454A75" d="M539.7 650.3v564.4l539.8-319.1z"/>
          <path fill="#8A92B2" d="M539.7 1316.9L0 998l539.7 760.6z"/>
          <path fill="#62688F" d="M1079.8 998l-540.1 318.9v441.7z"/>
        </svg>
        <div class="flex flex-1 flex-col ml-2 text-base-content">
        <span class="text-sm font-bold">PORTFOLIO</span>
        <div class="flex flex-row">
          <span id='p{i}' class="text-sm font-bold text-left">{account.name}</span>
          <input id="ename{i}"
            class="w-full text-gray-700 bg-gray-100 border border-solid border-gray-300 transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            autocomplete="off" 
            value="{$form.email}" hidden/>
          <!-- <div role="button" class="text-right" on:click|preventDefault={() => handleAccountName('p', i)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-right">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </div>               -->
        </div>
        <span class="text-xs font-bold">{account.address}</span>
        <span class="text-xs font-bold">{account.value} {symbolLabel}</span> 
        {console.log(`Account: ${i}`, account)}
        </div>
      </a>
    </li>
    {:else if account.accountType === AccountTypeCategory.SUB}
    <li class="my-2 ml-3">
      <!-- svelte-ignore a11y-missing-attribute -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <a role="button" on:click|preventDefault={() => handleAccounts(account)} class="flex items-center p-2 text-base-content bg-secondary rounded-lg hover:bg-secondary-focus group hover:shadow">
        <div class="flex flex-1 flex-col text-base-content">
        <span class="text-sm font-bold">SUB-PORTFOLIO</span>
        <span class="text-sm font-bold">{account.name}</span>
        <span id='s{i}' class="text-xs font-bold">{account.address}</span>
        <span class="text-xs font-bold">{account.value} {symbolLabel}</span> 
        </div>
      </a>
      {console.log(`Account: ${i}`, account)}
    </li>
    {:else}
    <li class="my-2">
      <!-- svelte-ignore a11y-missing-attribute -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
      <a role="button" on:click|preventDefault={() => handleAccounts(account)} class="flex items-center p-2 text-base-content bg-accent rounded-lg hover:bg-accent-focus group hover:shadow">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="w-6 h-6" fill="none" viewBox="-161.97 -439.65 1403.74 2637.9">
          <path fill="#8A92B2" d="M539.7 650.3V0L0 895.6z"/>
          <path fill="#62688F" d="M539.7 1214.7V650.3L0 895.6zm0-564.4l539.8 245.3L539.7 0z"/>
          <path fill="#454A75" d="M539.7 650.3v564.4l539.8-319.1z"/>
          <path fill="#8A92B2" d="M539.7 1316.9L0 998l539.7 760.6z"/>
          <path fill="#62688F" d="M1079.8 998l-540.1 318.9v441.7z"/>
        </svg>
        <div class="flex flex-1 flex-col ml-2 text-base-content">
        <span class="text-sm font-bold">IMPORTED</span>
        <span class="text-sm font-bold">{account.name}</span>
        <span id='i{i}' class="text-xs font-bold">{account.address}</span>
        <span class="text-xs font-bold">{account.value} {symbolLabel}</span> 
        </div>
      </a>
    </li>
    {/if}
    {/each}
    {#if currentlySelected && currentlySelected.shortcuts.address === YAKKL_ZERO_ADDRESS}
    <p class="text-lg font-bold">There are no Portfolio Accounts to display! Create at least one Portfolio account!</p>
    {/if}
    
  </ul>  
  <svelte:fragment slot='footer'>
    <p class="text-sm font-normal text-gray-500 dark:text-gray-400">Whatever account you select will become your <span class="border-b-2 underline underline-offset-8">active</span> account!</p>
  </svelte:fragment>
</Modal>

<Modal title="Contact List" bind:open={showContacts} size="xs" class="p-4">
  <p class="text-sm font-normal text-gray-700 dark:text-gray-400">List of contacts</p>
  {#if $yakklContactsStore}
  <ul class="my-4 space-y-3">
    {#each $yakklContactsStore as contact}
      <li class="my-2">
      <!-- svelte-ignore a11y-missing-attribute -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-interactive-supports-focus -->
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

<!-- Receive -->
<!-- <div class="modal" class:modal-open={showRecv}>
  <div class="modal-box relative text-base-content">
    <h3 class="text-lg font-bold">Receive</h3>

    <div class="text-center">
      <div class="m-2">
        <QR qrText={address}/>
        <div class="flex mx-auto justify-center w-full h-full" bind:this={node}></div>
      </div>
  
      <div class="border border-base-content rounded-lg w-full mb-2 p-2 ">
        <p class="text-xs font-semibold" data-bs-toggle="tooltip" data-bs-placement="top" title={address}>{address}
          <button class="clip w-4 h-4 ml-1 mt-0.5" data-clipboard-action="copy" data-clipboard-target="#pkey1" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy Address!">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-base-content" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>        
          </button>
          <input id="pkey1" value=":yakkl:{address}" type="hidden">
        </p>
      </div>
      <p class="text-sm font-normal mt-8">Scan the barcode for your mobile device or click the copy button so you can paste it.</p>
    </div>
  
    <div class="modal-action">
      <button class="btn" on:click={()=>showRecv = false}>Close</button>
    </div>
  </div>
</div> -->

<Modal title="Receive" bind:open={showRecv} size="xs" class="xs" color="default" > 
  <div class="text-center prose">
    <div class="mb-4">
      {#if currentlySelected && currentlySelected.shortcuts.address !== YAKKL_ZERO_ADDRESS}
      <QR qrText={address}/>
      {:else}
      <p class="text-lg font-bold">There are no Portfolio Accounts to display! Create at least one Portfolio account!</p>      
      {/if}
    </div>

    {#if currentlySelected && currentlySelected.shortcuts.address !== YAKKL_ZERO_ADDRESS}
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

<!-- ?? -->

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

<!-- NOTE: Maybe look at success and failure/warning version -->
<Toast color="green" transition={slide} bind:open={toastShow}>
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
    <!-- bg-[url('/images/{card}')] -->

    <!-- arrows - release the arrows once we have the other cards ready -->    
    <!-- <div class="absolute left-0 top-[6.75rem] bg-slate-300 w-6 h-12 rounded-tr-full rounded-br-full opacity-50 hover:opacity-25" role="button">
      <span class="relative top-[.8rem] -left-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" class="w-6 h-6 stroke-base-100">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>        
      </span>
    </div>
    <div class="absolute right-0 top-[6.75rem] bg-slate-300 w-6 h-12 rounded-tl-full rounded-bl-full opacity-50 hover:opacity-25" role="button">
      <span class="relative top-[.8rem] -right-1">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" class="w-6 h-6 stroke-base-100">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </span>
    </div> -->

    <div class="grid grid-rows-5 gap-1 h-full">
      <div class="absolute left-4 bottom-1 ">
        <span class="text-gray-100 text-lg">Asset Price:</span>
        <span class="ml-2 text-gray-100 text-lg">{assetPrice} {currencyLabel}</span>
        <!-- <Chart/> -->
      </div>

      <SpeedDial defaultClass="absolute right-1 bottom-1 z-10 bg-primary rounded-full" pill={false} tooltip="none" placement='bottom'>
        <svg slot="icon" aria-hidden="true" class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
        <!-- <SpeedDialButton name="Share">
            <svg aria-hidden="true" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path></svg>
        </SpeedDialButton>-->
        <SpeedDialButton name="EXIT" on:click={() => goto(PATH_LOGOUT)}>
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
              <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
              <path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd" />
            </svg>            
        </SpeedDialButton> 
        <SpeedDialButton name="Logout" on:click={() => goto(PATH_LOCK)}>
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd" />
          </svg>            
      </SpeedDialButton> 
      <SpeedDialButton name="Receive" on:click={() => {showRecv=true}}>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
            <path fill-rule="evenodd" d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zM6 6.75A.75.75 0 016.75 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75A.75.75 0 016 7.5v-.75zm9.75 0A.75.75 0 0116.5 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 19.125v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875-.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM6 16.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm9.75 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm-3 3a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75z" clip-rule="evenodd" />          
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Contact" on:click={() => {showContacts = true}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true" class="w-6 h-6" fill="currentColor">
            <path fill-rule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Account" on:click={() => {showAccountsModal = true}}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true" class="w-6 h-6" fill="currentColor">
            <path fill-rule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton>
      </SpeedDial>

      <nav id="{id}" class="print:hidden visible relative row-span-1 inset-x-0 navbar navbar-expand-sm p-2 flex items-center w-full justify-between">
        <div class="flex text-center justify-left w-[410px]">
          <span class="text-gray-100 text-center dark:text-white text-4xl ml-2 -mt-6 font-bold">{currentlySelected && currentlySelected.shortcuts.blockchain}</span>
          
          <!-- Only show if this option is enabled -->
          {#if showTestNetworks}        
          <span class="flex h-6 absolute top-2 right-8">
            <div class="dropdown dropdown-bottom">
              <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
              {#if networkLabel.toLowerCase() === 'mainnet'} 
              <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
              <label tabindex="0" role="button" class="w-28 px-3 py-1 bg-red-800/80 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg active:text-white transition duration-150 ease-in-out flex items-center whitespace-nowrap">LIVE-{networkLabel}</label>
              {:else}
              <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
              <label tabindex="0" role="button" class="w-28 px-3 py-1 bg-green-800/80 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg active:text-white transition duration-150 ease-in-out flex items-center whitespace-nowrap">Test-{networkLabel}</label>
              {/if}
              <!-- svelte-ignore a11y-missing-attribute -->
              <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
              <!-- svelte-ignore a11y-label-has-associated-control -->
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

      <!-- BETA phase - remove button until Nov 1, 2023 -->
      <!-- <Button id="upgrade" on:click={() => {upgrade=true}} class="z-10 absolute w-[100px] h-[20px] top-[50px] right-[23px] text-xs" shadow="purple" pill=true gradient color="purple">
        UPGRADE
      </Button> -->

      <div class="ml-4">
        <div class="row-span-2 -mt-4">
          <p class="text-gray-100 dark:text-white text-lg">Account:</p>
            <p class="text-gray-100 dark:text-white text-lg ml-4 -mt-1" data-bs-toggle="tooltip" data-bs-placement="top" title={name}>Name: <span class="uppercase ml-5">{nameShow}</span></p> 
            <p class="text-gray-100 dark:text-white text-lg ml-4 -mt-2" data-bs-toggle="tooltip" data-bs-placement="top" title={address}>Number: <span class="ml-1">{addressShow}</span>
              <button id="copy" on:click|preventDefault={handleCopy} class="clip w-6 h-6 ml-1 mt-0.5 hover:text-gray-500" data-clipboard-action="copy" data-clipboard-target="#paddress" data-yakkl-copy="yakkl">  
                <svg id="copy2" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 dark:text-white hover:stroke-gray-200" data-yakkl-copy="yakkl" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>        
              </button>
              <input id="paddress" name="address" value=":yakkl:{address}" type="hidden" data-yakkl-copy="yakkl">
            </p>
        </div>
        <!-- Network Logo (default is ethereum) -->
        <div class=" absolute top-[118px] left-[175px] opacity-25 -z-10">
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
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="{shortcutsValue.toString()}">{value.toWei()}</span>
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

