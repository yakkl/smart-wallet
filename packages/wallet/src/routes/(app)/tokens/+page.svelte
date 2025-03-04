<script lang="ts">
	import { goto } from '$app/navigation';
	import { decryptData, error_log, isEncryptedData, PATH_WELCOME } from '$lib/common';
	import type { AccountData, CurrentlySelectedData, SwapPriceProvider, TokenData, YakklAccount, YakklContact, YakklWatch } from '$lib/common/interfaces';
	import Accounts from '$lib/components/Accounts.svelte';
	import Contacts from '$lib/components/Contacts.svelte';
	import ExportPrivateKey from '$lib/components/ExportPrivateKey.svelte';
	import ImportPhrase from '$lib/components/ImportPhrase.svelte';
	import ImportPrivateKey from '$lib/components/ImportPrivateKey.svelte';
	import ImportWatchAccount from '$lib/components/ImportWatchAccount.svelte';
	import Pincode from '$lib/components/Pincode.svelte';
	import PincodeModal from '$lib/components/PincodeVerify.svelte';
	import Receive from '$lib/components/Receive.svelte';
  import TokenBox from '$lib/components/TokenBox.svelte';
  // import { ethTokenData, btcTokenData } from '$lib/data/mock/MockTokenData';
  // import Profile from '$lib/components/Profile.svelte.tmp';
  // import Preferences from '$lib/components/Preferences.svelte.tmp';
  import EmergencyKitModal from '$lib/components/EmergencyKitModal.svelte';
  import RegistrationOptionModal from '$lib/components/RegistrationOptionModal.svelte';
	import ImportOptionModal from '$lib/components/ImportOptionModal.svelte';
	import SwapModal from '$lib/components/SwapModal.svelte';
  import type { SwapToken as Token } from '$lib/common/interfaces';
	import type { BigNumberish } from '$lib/common';
	import { getYakklCurrentlySelected, getMiscStore } from '$lib/common/stores';
	import { onMount } from 'svelte';
  import PriceTracker from '$lib/components/PriceTracker.svelte';
  import TokenPrice from '$lib/components/TokenPrice.svelte';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
	import type { Wallet } from '$lib/plugins/Wallet';
	import WalletManager from '$lib/plugins/WalletManager';
	import type { Provider } from '$lib/plugins';
	import type { Ethereum } from '$lib/plugins/blockchains/evm/ethereum/Ethereum';
	import { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	import { UniswapSwapManager } from '$lib/plugins/UniswapSwapManager';
	import Swap from '$lib/components/Swap.svelte';
	import { getYakklCurrentlySelectedAccountKey } from '$lib/common/security';
	import SendFormModal from '$lib/components/send/SendFormModal.svelte';
  import { log } from '$plugins/Logger';

  const providers = [new CoinbasePriceProvider];

  // let profileComponent: Profile = $state();
  // let preferencesComponent: Preferences = $state();

  // Mock token data array
  const tokenDataArray: TokenData[] = []; //[ethTokenData, btcTokenData];

  let showImportPhrase = $state(false);
  let showExportPrivateKey = $state(false);
  let showImportWatch = $state(false);
  let showImportAccount = $state(false);
  let showPincodeModal = $state(false);
  let showPincode = $state(false);
  let showAccounts = $state(false);
  let showContacts = $state(false);
  let showReceive = $state(false);
  let showEmergencyKit = $state(false);
  let showRegistrationOptions = $state(false);
  let showImportOptions = $state(false);
  let showSwap = $state(false);
  let showSwapModal = $state(false);
  let showSendModal = $state(false);

  let fundingAddress: string = $state();
  let account: YakklAccount | null = null;
  let mode: 'import' | 'export' = $state('export');

  let swapPriceProvider: SwapPriceProvider | null = null; // Don't have to set it to null
  let provider: Provider = $state();
  let chainId = 1;
  let blockchain: Ethereum = $state();
  let swapManager: UniswapSwapManager = $state();
  let tokenService: TokenService<any> = $state();
  // let gasProvider: EthereumGasProvider;

  onMount(async () => {
    try {
      const currentlySelected = await getYakklCurrentlySelected();
      // const yakklMiscStore = getMiscStore();

      if (currentlySelected.shortcuts?.address) {
        fundingAddress = currentlySelected.shortcuts.address;
      }
      chainId = currentlySelected.shortcuts?.chainId ?? 1;
      if (swapPriceProvider === null) {
        let wallet: Wallet | null = null;
        wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], chainId, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
        if (wallet) {
          if (!wallet.getSigner()) {
            const accountKey = await getYakklCurrentlySelectedAccountKey();
            if (accountKey && accountKey.privateKey) await wallet.setSigner(accountKey.privateKey); // Could have sent this to getInstance as well
          }

          provider = wallet.getProvider()!; // Only for testing
          if (provider) {
            const signer = wallet.getSigner();
            if (signer) {
              provider.setSigner(signer);
            }
            blockchain = wallet.getBlockchain() as Ethereum;

            swapManager = new UniswapSwapManager(blockchain as Ethereum, provider!);
            tokenService = new TokenService(blockchain as Ethereum);
            // gasProvider = new EthereumGasProvider(provider!, blockchain!, new CoinbasePriceProvider());
            // swapPriceProvider = new UniswapSwapPriceProvider(provider, new CoinbasePriceProvider());
          }
        }
      }
    } catch (error) {
      error_log('SwapTokenPrice:', false, error);
    }
  });

  function close() {
    goto(PATH_WELCOME);
  }


// This is for future reference:
// import { swapServices } from './swapService';
// // ... in your swap function
// const bestQuote = await swapServices.swapAggregator.getBestQuote(tokenIn, tokenOut, amountIn);
// log.debug(`Best quote from: ${bestQuote.provider}`);
// // Execute the swap
// const txResponse = await swapServices.swapAggregator.executeBestSwap(tokenIn, tokenOut, amountIn, minAmountOut, recipient, deadline);


  function onSwap(fundingAddress: string, fromToken: Token, toToken: Token, fromAmount: BigNumberish, toAmount: BigNumberish) {
    // log.debug(`onSwap-Testing: fundingAddress=${fundingAddress}, fromToken=${fromToken}, toToken=${toToken}, fromAmount=${fromAmount}, toAmount=${toAmount}`);
  }

  function openSendModal() {
    showSendModal = true;
  }

  function handleSendModal() {
    showSendModal = false;
  }

  function handleAccounts(selectedAccount: YakklAccount) {
    // Handle the selected account here
    // log.debug('Selected account:', selectedAccount);
  }

  function handleContact(selectedContact: YakklContact) {
    // Handle the selected contact here
    // log.debug('Selected contact:', selectedContact);
  }

  function handleImport(account: YakklAccount) {
    // Handle the imported account here
    // log.debug('Imported account:', account);
  }

  function handleVerifyModal(pincode: string) {
    // Handle the pincode here
    // log.debug('Pincode:', pincode);
  }

  function handleVerify(pincodeOld: string, pincodeNew: string) {
    // Handle the pincode here
    // log.debug('Pincode - old and new:', pincodeOld, pincodeNew);
  }

  function handleImportWatch(account: YakklWatch) {
    // Handle the import watch account here
    // log.debug('Import watch account');
  }

  function handleExportPrivateKey() {
    // Handle the export private key here
    // log.debug('Export private key');
  }

  function handleImportPhrase() {
    // Handle the import phrase here
    // log.debug('Import phrase account:', account);
  }

  function handleEmergencyKit(success: boolean, message: string) {
    // Handle the emergency kit here
    showEmergencyKit = false;
    // log.debug('Emergency kit:', success, message);
  }

  function handleCreateAccount() {
    // log.debug('Create initial account - actual implementation not provided');
    // Add your logic here
  }

  function handleImportPrivateKey() {
    // log.debug('Import an existing account - actual implementation not provided');
    // Add your logic here
  }

  function handleRestore() {
    // log.debug('Restore from Emergency Kit - actual implementation not provided');
    // Add your logic here
  }

  function handleCancel() {
    showRegistrationOptions = false;
    // Add any additional cancel logic here
  }

</script>

<div class="h-screen overflow-y-auto p-4">
  <!-- <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto bg-white p-4">
    {#each tokenDataArray as token}
      <div class="rounded-2xl overflow-hidden shadow-md">
        <TokenBox {token} />
      </div>
    {/each}
  </div> -->

  <div class="my-4">
    <SendFormModal bind:show={showSendModal} />
  </div>

  <div class="my-4">
    <RegistrationOptionModal bind:show={showRegistrationOptions} onCreate={handleCreateAccount} onImport={() => {}}/>
  </div>

  <div class="my-4">
    <!-- Shows SwapPriceTracker and SwapTokenPrice -->
    <SwapModal bind:show={showSwapModal} {fundingAddress} {provider} {blockchain} {swapManager} {tokenService} />
  </div>

  <div class="my-4">
    <Swap bind:show={showSwap} {fundingAddress} {onSwap} {provider} {blockchain} {swapManager} {tokenService} />
  </div>

  <div class="my-4">
    <ImportOptionModal bind:show={showImportOptions} showImportWatch={true} onImportKey={() => {showImportOptions=false; showImportAccount=true;}} onImportPhrase={() => {showImportOptions=false; showImportPhrase=true;}} onRestore={() => {showImportOptions=false; mode='import'; showEmergencyKit=true;}} onImportWatch={() => {showImportOptions=false; showImportWatch=true;}}/>
  </div>

  <div class="my-4">
    <ExportPrivateKey bind:show={showExportPrivateKey} onVerify={handleExportPrivateKey} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <PincodeModal bind:show={showPincodeModal} onVerified={handleVerifyModal} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <Pincode bind:show={showPincode} onVerified={handleVerify} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <ImportWatchAccount bind:show={showImportWatch} onComplete={handleImportWatch} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <ImportPrivateKey bind:show={showImportAccount} onComplete={handleImport} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <ImportPhrase bind:show={showImportPhrase} onComplete={handleImportPhrase} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <Accounts bind:show={showAccounts} onAccountSelect={handleAccounts} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <Contacts bind:show={showContacts} onContactSelect={handleContact} />
  </div>

  <div class="my-4">
    <!-- Foundry primary test account -->
    <Receive bind:show={showReceive} address={"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"} />
  </div>

  <div class="my-4">
    <EmergencyKitModal bind:show={showEmergencyKit} {mode} onComplete={handleEmergencyKit} />
  </div>

  <div class="my-4">
    <PriceTracker symbol="ETH" currency="USD" >
      {#snippet children({ price })}
            {#if price !== null}
          <span class="text-xl font-semibold text-blue-600">{price.price} USD (no formatting using PriceTracker)</span>
          <span class="text-sm text-gray-500">{price.provider}</span>
        {:else}
          <span class="text-gray-500">Fetching price...</span>
        {/if}
                {/snippet}
        </PriceTracker>
  </div>

  <div class="my-4">
    <div class="p-6 space-y-8">
      <h1 class="text-2xl font-bold mb-4">Crypto Dashboard example using TokenPrice</h1>

      <div class="bg-white shadow rounded-lg p-4">
        <h2 class="text-lg font-semibold mb-2">Ethereum Price</h2>
        <TokenPrice
          symbol="ETH"
          currency="USD" />
      </div>

      <div class="bg-gray-100 shadow rounded-lg p-4">
        <h2 class="text-lg font-semibold mb-2">BTC Price</h2>
        <TokenPrice
          symbol="BTC"
          customClass="bg-yellow-100 p-2 rounded"
        />
      </div>

    </div>
  </div>

  <!-- <Profile bind:this={profileComponent} />

  <Preferences bind:this={preferencesComponent} /> -->

  <!-- <div class="my-4 p-2 border-gray-100 border-2">
    <p class="text-gray-100 text-sm">Experimental Only</p>

    <button
      onclick={() => profileComponent.openProfile()}
      class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
      Open Profile
    </button>

    <button
      onclick={() => preferencesComponent.openPreferences()}
      class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
      Open Preferences
    </button>
  </div> -->


  <button
    onclick={() => showSwapModal = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    SwapModal
  </button>

  <button
    onclick={() => showSwap = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Swap
  </button>

  <button
    onclick={() => showSendModal = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Send Transaction
  </button>

  <button
    onclick={() => showRegistrationOptions = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Registration Options
  </button>

  <button
    onclick={() => showImportOptions = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Options
  </button>

  <button
    onclick={() => {showEmergencyKit = true; mode = 'export';}}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Export Emergency Kit
  </button>

  <button
    onclick={() => {showEmergencyKit = true; mode = 'import';}}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Emergency Kit
  </button>

  <button
    onclick={() => showExportPrivateKey = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Export Private Key
  </button>

  <button
    onclick={() => showPincode = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Pincode
  </button>

  <button
    onclick={() => showPincodeModal = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Pincode Modal
  </button>

  <button
    onclick={() => showReceive = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Receive
  </button>

  <button
    onclick={() => showContacts = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Contacts
  </button>

  <button
    onclick={() => showImportWatch = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Watch Account
  </button>

  <button
    onclick={() => showImportAccount = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Account w/PKey
  </button>

  <button
    onclick={() => {log.debug('showImportPhrase'); showImportPhrase = true}}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Phrase
  </button>

  <button
    onclick={() => showAccounts = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Accounts
  </button>

  <button
    onclick={close}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Cancel
  </button>
</div>
