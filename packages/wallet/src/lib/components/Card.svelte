<script lang="ts">
  // Import statements
  import { goto } from '$app/navigation';
  import { SpeedDial, SpeedDialButton } from 'flowbite-svelte';
  import { yakklPricingStore, setYakklCurrentlySelectedStorage, getYakklCurrentlySelected, getMiscStore, yakklCurrentlySelectedStore, yakklAccountsStore, yakklCombinedTokenStore } from '$lib/common/stores';
  import { PATH_LOGOUT } from '$lib/common/constants';
  import { onDestroy, onMount } from 'svelte';
  import { truncate, timeoutClipboard } from "$lib/utilities/utilities";
  import { encryptData, decryptData } from '$lib/common/encryption';
  import { checkPricesCallback, startPricingChecks, stopCheckPrices } from '$lib/tokens/prices';
  import ErrorNoAction from '$lib/components/ErrorNoAction.svelte';
  import { NetworkType, getInstances, isEncryptedData, type CurrentlySelectedData, type Network, type TokenData, type YakklAccount } from '$lib/common';
  import type { BigNumberish } from '$lib/common/bignumber';
  import { Toast } from 'flowbite-svelte';
  import { slide } from 'svelte/transition';
  import { Wallet } from '$lib/plugins/Wallet';
  import { EthereumBigNumber } from '$lib/common/bignumber-ethereum';
	import Accounts from './Accounts.svelte';
	import Contacts from './Contacts.svelte';
  import Tokens from './Tokens.svelte';
	import Receive from './Receive.svelte';
	import ImportPrivateKey from './ImportPrivateKey.svelte';
	import type { Blockchain } from '$lib/plugins/Blockchain';
	import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	import type { Provider } from '$lib/plugins/Provider';
	import EyeIcon from './icons/EyeIcon.svelte';
	import ProtectedValue from './ProtectedValue.svelte';
	import { tokenTotals } from '$lib/common/stores/tokenTotals'; // Used to display portfolio value in html below
  import { browserSvelte, browser_ext } from '$lib/common/environment';
	import { handleOnMessageForPricing } from '$lib/common/listeners/ui/uiListeners';
  import { log } from "$plugins/Logger";
	import Copy from './Copy.svelte';

  // import { PriceManager } from '$lib/plugins/PriceManager';
	// import { createPriceUpdater } from '$lib/common/createPriceUpdater';
	// import { tokenManager } from '$lib/common/stores/tokenManager';
	// import { get } from 'svelte/store';
	// import { isEqual } from 'lodash-es';
	// import type { Runtime } from 'webextension-polyfill';

  interface Props {
    id?: string;
  }

  let { id = "card" }: Props = $props();

  let wallet: Wallet | null = null;
  let provider: Provider | null = null;
  let blockchain: Blockchain | null = null;
  let tokenService: TokenService<any> | null = null;

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

  let network: Network = $state(networks[0]);
  let networkLabel = $state('Mainnet');
  let addressShow: string = $state('');
  let address: string = $state('');
  let name: string = $state('');
  let nameShow: string = $state('');
  let valueFiat = $state('0.00');
  let showAccountsModal = $state(false);
  let showAccountImportModal = $state(false);
  let showContacts = $state(false);
  let showTokens = $state(false);
  let showRecv = $state(false);

  // let userName = $yakklUserNameStore;
  // let upgrade = $state(false);
  // let serialNumber = $state('');
  // let promoCode = 'BETA';
  // let step1 = $state(false);
  // let checkPricesProvider: string = 'coinbase';
  // let checkPricesInterval: number = 10; // Seconds

  let price: number = 0;
  let prevPrice: number = 0;
  let direction: string = $state('fl');
  let showTestNetworks = true;
  let error = $state(false);
  let errorValue: string = $state('');
  let assetPriceValue: BigNumberish = $state(0n);
  let assetPrice: string = $state('');
  let card = 'ethereum-background.png';

  let yakklMiscStore: string = getMiscStore();
  let symbolLabel: string = $state('');
  let currencyLabel: string = $state('');
  let currency: Intl.NumberFormat = $state();
  let shortcutsValue: EthereumBigNumber = $state(EthereumBigNumber.from(0)); // .value is the amount of a given token the address holds
  let chainId: number = $state(1);
  let formattedEtherValue: string = $state('');
  let isDropdownOpen = $state(false);

  // let priceUpdater = createPriceUpdater(new PriceManager(), 30000);
  let tokens: TokenData[] = [];
  // let effectTimeout: NodeJS.Timeout;

  //////// Toast
  // let toastStatus = $state(false);
  // let toastCounter = 3;
  // let toastMessage = $state('Success');
  // let toastType = 'success';

  // function toastTrigger(count = 3, msg = 'Success') {
  //   toastStatus = true;
  //   toastCounter = count;
  //   toastMessage = msg;
  //   timeout();
  // }
  //////// Toast

  // function timeout(): NodeJS.Timeout | void {
  //   if (--toastCounter > 0) return setTimeout(timeout, 1000);
  //   toastStatus = false;
  // }

  $effect(() => {
    (async () => {
      if ($yakklPricingStore) {
        if ($yakklPricingStore.price === $yakklPricingStore.prevPrice) {
          log.info('Price has not changed.');
          return; // No change
        }
        price = $yakklPricingStore.price ?? 0;
        const prevPrice = $yakklPricingStore.prevPrice ?? 0;
        log.info('Price changed:', price, prevPrice);
        if (price) {
          if (price !== prevPrice) { // Only update if the value changes - updateValuePriceFiat (balance update can cause a loop here so be mindful). This will be changing!
            await updateValuePriceFiat();
            await updateWithCurrentlySelected();
          }
        }
      }
    })();
  });

  $effect(() => {
    if (assetPriceValue) {
      const newAssetPrice = currency ? currency.format(Number(assetPriceValue)) : '0.00';
      if (assetPrice !== newAssetPrice) {
        assetPrice = newAssetPrice; // Only update if the value changes
      }
    }
  });

  // $effect(()=> {
  //   clearTimeout(effectTimeout);
  //     effectTimeout = setTimeout(() => {
  //     startPricingChecks(); // Here because of different accounts with different values
  //     (async () => {
  //       await updateValuePriceFiat();
  //       await updateWithCurrentlySelected();
  //     })();
  //   }, 200); // 200ms delay
  // });

  $effect(() => {
    if (!address) {
      address = $yakklCurrentlySelectedStore?.shortcuts?.address ?? '';
    }
  });

  $effect.root(() => {
    // Subscribe to token store updates
    const unsubscribeYakklStore = yakklCombinedTokenStore.subscribe((updatedTokens = []) => {
      tokens = updatedTokens; // Only keep the latest tokens up to date
    });

    return () => {
      unsubscribeYakklStore();
    };
  });

  onMount(async () => {
    try {
      if (browserSvelte) {
        try {
          if (!browser_ext.runtime.onMessage.hasListener(handleOnMessageForPricing)) {
            browser_ext.runtime.onMessage.addListener(handleOnMessageForPricing);
          }
        } catch (error) {
          log.error('Card - onMount - onMessage error. Continuing',error);
        }

        startPricingChecks();

        // toastStatus = false;
        if (!$yakklCurrentlySelectedStore) yakklCurrentlySelectedStore.set(await getYakklCurrentlySelected());
        if (!yakklMiscStore) yakklMiscStore = getMiscStore();

        if ($yakklCurrentlySelectedStore) {
          const currentlySelected = $yakklCurrentlySelectedStore;
          currentlySelected.shortcuts.networks = networks;

          currencyLabel = currentlySelected.preferences.currency.code ?? 'USD';
          currency = new Intl.NumberFormat('en-US', { style: "currency", currency: currencyLabel });
          symbolLabel = currentlySelected.shortcuts.symbol ?? 'ETH';
          chainId = currentlySelected.shortcuts.network.chainId ?? 1;

          const instances = await getInstances();
          if (instances.length > 0) {
            wallet = instances[0];
            provider = instances[1];
            blockchain = instances[2];
            tokenService = instances[3];

            if (wallet && provider && blockchain && tokenService) {
              tokenService.updateTokenBalances(currentlySelected.shortcuts.address);
            }
          }

          // These are for the initial load and the intervals take over after this
          const val = await getBalance(currentlySelected.shortcuts.network.chainId, currentlySelected.shortcuts.address);
          currentlySelected.shortcuts.value = val ?? 0n;
          checkPricesCallback(); // Simple onetime price update for initial load - NOTE: Do not move this up any higher in the code or it will cause a loop. shortcuts.value is used in the updateValuePriceFiat function

          await setYakklCurrentlySelectedStorage(currentlySelected); // This updates the store and local storage
          if ($yakklCurrentlySelectedStore.shortcuts.value) await updateValuePriceFiat();
          // updateUpgradeButton();
        }
      }
    } catch (e) {
      log.error(`onMount: ${e}`);
    }
  });

  async function updateWithCurrentlySelected() {
    try {
      const { address, accountName, network, value } = $yakklCurrentlySelectedStore.shortcuts;

      addressShow = truncate(address, 6) + address.substring(address.length - 4);
      name = accountName;
      nameShow = truncate(accountName, 20);
      networkLabel = $yakklCurrentlySelectedStore.shortcuts.network.name ?? network.name;
      assetPriceValue = $yakklPricingStore?.price ?? 0;
      currencyLabel = $yakklCurrentlySelectedStore.preferences.currency.code ?? "USD";

      shortcutsValue = EthereumBigNumber.from(value) ?? EthereumBigNumber.from(0); // .value is the amount of a given token the address holds
      chainId = network?.chainId ?? 1;
    } catch (e) {
      log.error(e);
    }
  }

  onDestroy(async () => {
    if ($yakklCurrentlySelectedStore) {
      await setYakklCurrentlySelectedStorage($yakklCurrentlySelectedStore);
    }
    stopCheckPrices();
  });

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  async function updateValuePriceFiat(): Promise<void> {
    try {
      if (!$yakklCurrentlySelectedStore) {
        log.info("No currently selected account.");
        resetPriceData();
        return;
      }

      let { address, value, network } = $yakklCurrentlySelectedStore.shortcuts;

      // Avoid unnecessary balance fetch
      const val = await getBalance(network.chainId, address);
      if ($yakklCurrentlySelectedStore.shortcuts.value !== val) {
        // This will force a reactivity update
        // This can also cause a loop if not careful and using $effect to watch for changes
        yakklCurrentlySelectedStore.update((current) => ({
          ...current,
          shortcuts: { ...current.shortcuts, value: val ?? 0n },
        }));
      }

      // Update fiat and ether values only if necessary
      const price = EthereumBigNumber.from($yakklPricingStore?.price ?? 0);
      if ($yakklCurrentlySelectedStore.shortcuts.value !== price) {
        const etherValue = parseFloat(formatEther($yakklCurrentlySelectedStore.shortcuts.value ?? 0n));
        if (!isNaN(etherValue) && $yakklPricingStore?.price) {
          const fiatValue = etherValue * $yakklPricingStore.price;
          const etherValueString = etherValue.toFixed(5);

          if (formattedEtherValue !== etherValueString) {
            formattedEtherValue = etherValueString;
          }

          const newFiatValue = currency ? currency.format(fiatValue) : "0.00";

          if (valueFiat !== newFiatValue) {
            valueFiat = newFiatValue;
          }

          updatePriceDirection($yakklPricingStore.price);
        } else {
          resetPriceData();
        }
      } else {
        log.info("updateValuePriceFiat - Value NOT updated.");
      }
    } catch (error) {
      log.error("Error in updateValuePriceFiat:", false, error);
      resetPriceData();
    }
  }

  function setDefaultsForZeroAddress() {
    try {
      // Dont want to trigger reactivity if the value is zero unless the previous value was something other than 0
      if (yakklCurrentlySelectedStore && ($yakklCurrentlySelectedStore.shortcuts?.value !== 0n)) {
        yakklCurrentlySelectedStore.update((current) => ({
          ...current,
          shortcuts: { ...current.shortcuts, value: EthereumBigNumber.from(0) },
        }));
      }
      resetPriceData();
    } catch (e) {
      log.error(e);
    }
  }

  function updatePriceDirection(newPrice: number) {
    if (prevPrice > newPrice) {
      direction = "dn"; // down
    } else if (prevPrice < newPrice) {
      direction = "up"; // up
    } else {
      direction = "fl"; // flat
    }
    prevPrice = newPrice;
  }

  function resetPriceData() {
    valueFiat = "0.00";
    formattedEtherValue = "0.00000";
    direction = "fl"; // flat
  }

  async function handleAccounts(account: YakklAccount): Promise<void> {
    try {
      if (!account) {
        log.warn("Account is not defined.");
        return;
      }

      let updatedCurrentlySelected = $yakklCurrentlySelectedStore; // Could just use $yakklCurrentlySelectedStore directly since the assignment is not reactive and only a reference

      if (updatedCurrentlySelected && isEncryptedData(updatedCurrentlySelected.data)) {
        updatedCurrentlySelected.data = (await decryptData(updatedCurrentlySelected.data, yakklMiscStore)) as CurrentlySelectedData;
      }

      const balance = await getBalance(chainId ?? 1, account.address);

      updatedCurrentlySelected = {
        ...updatedCurrentlySelected,
        shortcuts: {
          ...updatedCurrentlySelected.shortcuts,
          accountType: account.accountType,
          address: account.address,
          primary: account.primaryAccount,
          accountName: account.name,
          value: balance ?? EthereumBigNumber.from(0),
        },
        data: await encryptData(
          {
            ...updatedCurrentlySelected?.data,
            account,
          },
          yakklMiscStore
        ),
      };

      // if (isEqual(updatedCurrentlySelected, $yakklCurrentlySelectedStore)) {
      //   debug_log("[INFO]: Currently selected count has not changed.");
      //   return;
      // }

      await setYakklCurrentlySelectedStorage(updatedCurrentlySelected); // This will force a reactive update due to store update in function

      // Update price and UI
      await updateWithCurrentlySelected();
      await updateValuePriceFiat();
      if (wallet && provider && blockchain && tokenService) {
        await tokenService.updateTokenBalances($yakklCurrentlySelectedStore.shortcuts.address);
      }
    } catch (error) {
      log.error("Error in handleAccounts:", false, error);
      showAccountsModal = false;
    }
  }

  async function handleNetworkTypeChange(net: Network) {
    try {
      if ($yakklCurrentlySelectedStore) {
        isDropdownOpen = false;
        if (net.chainId === $yakklCurrentlySelectedStore.shortcuts.chainId ) {
          return;
        }

        const currentlySelected = $yakklCurrentlySelectedStore; // Could just use $yakklCurrentlySelectedStore directly since the assignment is not reactive and only a reference
        $yakklCurrentlySelectedStore.shortcuts.chainId = net.chainId;
        chainId = net.chainId;
        network = net;
        $yakklCurrentlySelectedStore.shortcuts.network = net;

        if (wallet) await wallet.setChainId(chainId);

        direction = 'fl';
        currentlySelected.shortcuts.symbol = network.symbol;
        currentlySelected.shortcuts.type = network.type.toString();

        const val = await getBalance(chainId, currentlySelected.shortcuts.address);
        currentlySelected.shortcuts.value = val ?? 0n;

        if (!isEncryptedData(currentlySelected.data)) {
          const encryptedData = await encryptData(currentlySelected.data, yakklMiscStore);
          currentlySelected.data = encryptedData;
        }

        await setYakklCurrentlySelectedStorage(currentlySelected); // Only want one update
        await updateValuePriceFiat();
        if (wallet && provider && blockchain && tokenService) {
          tokenService.updateTokenBalances($yakklCurrentlySelectedStore.shortcuts.address);
        }
        // Close the dropdown
        isDropdownOpen = false;
      }
    } catch (e) {
      log.error(e);
      errorValue = e as string;
      error = true;
    }
  }

  async function handleContact() {
    try {
      showAccountImportModal = false;
      updateValuePriceFiat();
    } catch (e) {
      log.error(e);
    }
  }

  async function handleToken() {
    try {
      showAccountImportModal = false; // ?????????
      updateValuePriceFiat();
    } catch (e) {
      log.error(e);
    }
  }

  async function handleImport() {
    try {
      log.info('handleImport - Not implemented');
    } catch (e) {
      log.error(e);
    }
  }

  // Gets the ether balance for the given address
  async function getBalance(chainId: number, address: string): Promise<bigint | null> {
    try {
      if (chainId && wallet) {
        if (wallet.getChainId() !== chainId) {
          await wallet.setChainId(chainId);
        }
        const val = await wallet.getBalance(address);
        return val;
      }
      return null;
    } catch (e) {
      log.error(e);
      errorValue = e as string;
      error = true;
      return null;
    }
  }

  // function handleCopy(e: any) {
  //   toastTrigger(3, 'Copied to clipboard');
  //   timeoutClipboard(20);
  // }

  function formatEther(value: BigNumberish): string {
    try {
      const val = EthereumBigNumber.from(value);
      // Convert from Wei to Ether and get string representation
      return val.toEtherString();
    } catch (e) {
      log.error(e);
      return '0.00000';
    }
  }

  // const { form, errors, states, isValid, handleChange, handleSubmit } = createForm({
  //   initialValues: { email: "" },
  //   validationSchema: yup.object().shape({
  //     email: yup.string().email('Must be a valid email.').required('Email is required.'),
  //   }),
  //   onSubmit: data => {
  //     try {
  //       // DURING BETA TESTING!
  //       //handleUpgrade(data.email);
  //     } catch (e) {
  //       errorValue = `Following error occurred: ${e}`;
  //       console.log(errorValue);
  //     }
  //   }
  // });

  // async function handleUpgrade(email: string) {
  //   try {
  //     if (!getUserName(email)) {
  //       console.log('Username has not been defined yet.');
  //       return;
  //     }

  //     let key = await getRegistrationKey(email);
  //     if (key === '' && userName) {
  //       handleOpenInTab(encodeURI("https://buy.stripe.com/test_28oaHm7Jt9lS9LqeUU?prefilled_promo_code=" + promoCode + "&client_reference_id=" + userName + "&prefilled_email=" + email + "&utm_source=yakkl&utm_medium=product&utm_campaign=" + promoCode));
  //     } else {
  //       console.log('Unable to return registration key.');
  //       throw 'Unable to return registration key.';
  //     }
  //     step1 = true;
  //     upgrade = true;
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // async function handleUpgradeSave() {
  //   try {
  //     if (!yakklMiscStore) {
  //       console.log('Username and/or password have not been defined at this time.');
  //       return; // undefined;
  //     }
  //     await getProfile().then(async result => {
  //       let profile = result as Profile;

  //       if (isEncryptedData(profile.data)) {
  //         await decryptData(profile.data, yakklMiscStore).then(async (result) => {
  //           profile.data = result as ProfileData;
  //           profile.data.registered.type = RegistrationType.PRO;
  //           profile.data.registered.key = serialNumber;
  //           yakklVersionStore.set('Pro - ' + serialNumber);

  //           await encryptData(profile.data, yakklMiscStore).then(async (result) => {
  //             profile.data = result;
  //             await setProfileStorage(profile);
  //           });
  //         });
  //       }
  //     });

  //     await getSettings().then(async result => {
  //       yakklSettings = result as Settings;
  //       yakklSettings.registeredType = RegistrationType.PRO;
  //       await setSettings(yakklSettings);
  //     });
  //     upgrade = false;
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }
  // function updateUpgradeButton() {
  //   if (checkUpgrade()) {
  //     if (browserSvelte) {
  //       const upgradeButton = document.getElementById('upgrade');
  //       if (upgradeButton) {
  //         upgradeButton.style.display = 'none';
  //       }
  //     }
  //   }
  // }

</script>

<ErrorNoAction bind:show={error} value={errorValue} title="ERROR!"/>

{#await $yakklAccountsStore}
<p>o_o</p>
{:then _}
{#if $yakklAccountsStore != undefined}
<Accounts bind:show={showAccountsModal} onAccountSelect={handleAccounts} className="text-gray-600"/>
<Contacts bind:show={showContacts} onContactSelect={handleContact} />
<Tokens bind:show={showTokens} onTokenSelect={handleToken} />
<Receive bind:show={showRecv} address={address} />
<ImportPrivateKey bind:show={showAccountImportModal} onComplete={handleImport} className="text-gray-600 z-[999]"/>

<!-- <Modal title="Upgrade to Pro" bind:open={upgrade} size="xs" class="xs" color="purple">
  <div class="text-center m-2">
    {#if !step1}
    <div id="step1" class="border border-purple-500 rounded-lg w-full mb-2 p-2 ">
      <form class="w-full" onsubmit={preventDefault(handleSubmit)}>
        <div class="pt-1 item-center w-full text-left mb-2">
          <span class="text-md text-purple-800 font-bold text-left mt-2 mb-1">Email required for upgrading:*</span>
          <input id="email"
              class="w-full px-3 md:py-2 py-1 text-lg font-normal text-gray-700 bg-gray-100  border border-solid border-gray-300 transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
              placeholder="Email"
              autocomplete="off"
              bind:value="{$form.email}"
              onchange={handleChange}
              aria-label="Email"
              required />
          {#if $errors.email}
          <small class="text-red-600 font-bold animate-pulse">{$errors.email}</small>
          {/if}

          <p class="text-md font-normal">Step 1. <span class="font-bold">Email is required for LATER billing.</span> Entering it here will automatically prefill the billing page (browser window). Billing is handled by Stripe and billing data is maintained there as well. Once you do that you can remove it, but the vendor requires it.</p>
          {#if promoCode === 'IYO'}
          <p class="text-md text-red">NOTE: The <span class="font-bold">IYO</span> promo code is being automatically passed to the processor. This means you get the Pro version for FREE because you're participating in our BETA release. Stripe, our processor, will prompt for a credit/debit card even though there will be NO CHARGE! This is for the annual recurring billing of $29.99. You can cancel that at any time.</p>
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
      <form class="w-full" onsubmit={handleUpgradeSave}>
        <div class="pt-1 item-center w-full text-left">
        <span class="text-md text-purple-800 font-bold text-left mt-2 mb-1">Pro Serial Number:*</span>
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
  {#snippet footer()}

      <p class="text-lg font-bold">Great choice!</p>
      <p class="text-sm font-normal">A number of advanced features can be unlocked by upgrading to Pro. Copy the serial number from the website (after completing the purchase) and paste it into the serial number field above and save. That's it!</p>

          {/snippet}
</Modal> -->
{/if}
{/await}

<!-- <Toast color="green" transition={slide} bind:toastStatus>

      {#if toastType === 'success'}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {/if}

  {toastMessage}
</Toast> -->

<div class="visible print:hidden relative top-0 mx-2">
  <div style="z-index: 4; background-image: url('/images/{card}'); " class="visible print:hidden relative m-2 ml-0 mr-0 h-[261px] rounded-xl">
    <div class="grid grid-rows-5 gap-1 h-full">
      <div class="absolute left-4 bottom-1">
        <span class="text-gray-100 text-md">Asset Market Price:</span>
        <span class="ml-2 text-gray-100 text-md">{assetPrice} {currencyLabel}</span>
      </div>

      <SpeedDial defaultClass="absolute right-1 bottom-1 z-10 bg-primary rounded-full" pill={false} tooltip="none" placement='bottom'>
        <!-- {#snippet icon()} -->
                <svg  aria-hidden="true" class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
              <!-- {/snippet} -->
        <!-- btnDefaultClass="w-16" -->
        <SpeedDialButton name="Accounts" on:click={() => {showAccountsModal = true}} class="w-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true" class="w-6 h-6" fill="currentColor">
            <path fill-rule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Contacts" on:click={() => {showContacts = true}} class="w-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true" class="w-6 h-6" fill="currentColor">
            <path fill-rule="evenodd" d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75zM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1v-.01zM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1h-.01a1 1 0 01-1-1V10z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Tokens" on:click={() => {showTokens = true}} class="w-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true" class="w-6 h-6" fill="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Receive" on:click={() => {showRecv=true}} class="w-16">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6">
            <path fill-rule="evenodd" d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 9.375v-4.5zM4.875 4.5a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 01-1.875-1.875v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zM6 6.75A.75.75 0 016.75 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75A.75.75 0 016 7.5v-.75zm9.75 0A.75.75 0 0116.5 6h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 013 19.125v-4.5zm1.875-.375a.375.375 0 00-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 00.375-.375v-4.5a.375.375 0 00-.375-.375h-4.5zm7.875-.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zM6 16.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm9.75 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm-3 3a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm6 0a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton>
        <SpeedDialButton name="Import Account" on:click={() => {showAccountImportModal = true}} class="w-16">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
        </SpeedDialButton>
        <!-- <SpeedDialButton name="Lock" on:click={() => goto(PATH_LOCK)} class="w-16">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" stroke="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h10.5A2.25 2.25 0 0118 4.25v10.5A2.25 2.25 0 0115.75 18h-10.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M8.704 10.943l1.048.943H3.75a.75.75 0 000 1.5h6.002l-1.048.943a.75.75 0 101.004 1.114l2.5-2.25a.75.75 0 000-1.114l-2.5-2.25a.75.75 0 10-1.004 1.114z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton> -->
        <SpeedDialButton name="Lock/Exit" on:click={() => goto(PATH_LOGOUT)} class="w-16">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" stroke="currentColor" class="w-6 h-6">
            <path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" />
            <path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clip-rule="evenodd" />
          </svg>
        </SpeedDialButton>
      </SpeedDial>

      <nav id="{id}" class="print:hidden visible relative row-span-1 inset-x-0 navbar navbar-expand-sm p-2 flex items-center w-full justify-between">
        <div class="flex text-center justify-left w-[410px]">
          <span class="text-gray-100 text-center dark:text-white text-4xl ml-2 -mt-6 font-bold">
            {$yakklCurrentlySelectedStore && $yakklCurrentlySelectedStore.shortcuts.network.blockchain}
          </span>
          {#if showTestNetworks}
          <span class="flex h-6 absolute top-2 right-8">
            <div class="dropdown dropdown-bottom relative">
              {#if networkLabel.toLowerCase() === 'mainnet'}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <button
                onclick={toggleDropdown}
                class="w-28 px-3 py-1 bg-red-800/80 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg active:text-white transition duration-150 ease-in-out flex items-center whitespace-nowrap"
              >
                LIVE-{networkLabel}
              </button>
              {:else}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <button
                onclick={toggleDropdown}
                class="w-28 px-3 py-1 bg-green-800/80 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg active:text-white transition duration-150 ease-in-out flex items-center whitespace-nowrap"
              >
                Test-{networkLabel}
              </button>
              {/if}
              {#if isDropdownOpen}
              <ul
                class="absolute top-full left-0 dropdown-content menu bg-opacity-70 text-base z-50 float-left py-2 list-none text-left rounded-lg shadow-lg mt-1 m-0 bg-clip-padding border-none bg-gray-800"
              >
                {#each networks as network}
                <li>
                    <!-- role="button"
                    tabindex="0"
                                  onkeydown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleNetworkTypeChange(network);
                      }
                    }}
                    -->
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    role="button"
                    tabindex="0"
                    class="dropdown-item text-sm py-2 px-4 font-normal w-full whitespace-nowrap bg-transparent text-gray-300 hover:bg-gray-500 hover:text-white focus:text-white focus:bg-gray-700"
                    onclick={() => handleNetworkTypeChange(network)}
                  >
                    {#if network.type === NetworkType.MAINNET}
                    LIVE-{network.name}
                    {:else}
                    Testnet-{network.name}
                    {/if}
                  </div>
                </li>
                {/each}
              </ul>
              {/if}
            </div>
          </span>
          {:else}
          <span class="flex h-6 absolute top-2 right-8">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label
              class="w-28 px-3 py-1 bg-red-800/80 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-red-700 hover:shadow-lg focus:bg-red-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg active:text-white transition duration-150 ease-in-out flex items-center whitespace-nowrap"
            >
              LIVE-{networkLabel}
            </label>
          </span>
          {/if}
        </div>
      </nav>

      <div class="ml-4">
        <div class="row-span-2 -mt-4">
          <p class="text-gray-100 dark:text-white text-lg">Account:</p>
          <p class="text-gray-100 dark:text-white text-lg ml-4 -mt-1" data-bs-toggle="tooltip" data-bs-placement="top" title={name}>Name: <span class="uppercase ml-5">{nameShow}</span></p>
          <p class="text-gray-100 dark:text-white text-lg ml-4 -mt-2" data-bs-toggle="tooltip" data-bs-placement="top" title={address}>Number: <span class="ml-1">{addressShow}</span>
            <Copy target={{value: address}} />
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
          <span data-bs-toggle="tooltip" data-bs-placement="top" title="{shortcutsValue.toEtherString()}">
            <ProtectedValue value={formattedEtherValue} placeholder="*******" />
          </span>
          <span class="ml-2">{symbolLabel}</span>
          <div class="relative">
            <EyeIcon />
          </div>
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
          <ProtectedValue value={valueFiat} placeholder="*******" />
          <span class="ml-2">{currencyLabel}</span>
        </div>

        <div class="flex justify-center text-lg text-gray-100 dark:text-white mt-2 row-span-1" style="max-width: 300px; overflow-x: auto; white-space: nowrap;">
          <span>Account Portfolio: </span>
          <span class="ml-2"><ProtectedValue value={$tokenTotals.formattedTotal} placeholder="*******" /></span>
        </div>

      </div>
    </div>
  </div>

  <!-- Card stack look -->
  <div style="z-index: 1;" class="grid w-[381px] left-[18.5px] bottom-[5px] h-[10px] absolute rounded bg-secondary text-accent-content place-content-center"></div>
  <div style="z-index: 0;" class="grid w-[366px] left-[27px] bottom-[2.5px] h-[10px] absolute rounded bg-accent text-secondary-content place-content-center"></div>
</div>
