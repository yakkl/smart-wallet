<script lang="ts">
	import { goto } from '$app/navigation';
	import { PATH_WELCOME } from '$lib/common';
	import type { TokenData, YakklAccount, YakklContact, YakklWatch } from '$lib/common/interfaces';
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
  import { ethTokenData, btcTokenData } from '$lib/data/mock/MockTokenData';
  import Profile from '$lib/components/Profile.svelte';
  import Preferences from '$lib/components/Preferences.svelte';
  import EmergencyKitModal from '$lib/components/EmergencyKitModal.svelte';
  import RegistrationOptionModal from '$lib/components/RegistrationOptionModal.svelte';
	import ImportOptionModal from '$lib/components/ImportOptionModal.svelte';
	import Swap from '$lib/components/Swap.svelte';
	import SwapModal from '$lib/components/SwapModal.svelte';
  import type { SwapToken as Token } from '$lib/common/interfaces';
	import type { BigNumberish } from '$lib/common';
	import { getYakklCurrentlySelected } from '$lib/common/stores';
	import { onMount } from 'svelte';

  let profileComponent: Profile;
  let preferencesComponent: Preferences;

  // Mock token data array
  const tokenDataArray: TokenData[] = [ethTokenData, btcTokenData];

  let showImportPhrase = false;
  let showExportPrivateKey = false;
  let showImportWatch = false;
  let showImportAccount = false;
  let showPincodeModal = false;
  let showPincode = false;
  let showAccounts = false;
  let showContacts = false;
  let showReceive = false;
  let showEmergencyKit = false;
  let showRegistrationOptions = false;
  let showImportOptions = false;
  let showSwap = false;
  let showSwapModal = false;

  let fundingAddress: string | null = null;
  let account: YakklAccount | null = null;
  let mode: 'import' | 'export' = 'export';

  $: {
    console.log('account', account);
  }

  onMount(async () => {
    const getCurrentlySelected = await getYakklCurrentlySelected();
    if (getCurrentlySelected?.shortcuts?.address) {
      fundingAddress = getCurrentlySelected.shortcuts.address;
    }
  });


  function close() {
    goto(PATH_WELCOME);
  }

  function onSwap(fundingAddress: string, fromToken: Token, toToken: Token, fromAmount: BigNumberish, toAmount: BigNumberish) {
    console.log(`onSwap-Testing: fundingAddress=${fundingAddress}, fromToken=${fromToken}, toToken=${toToken}, fromAmount=${fromAmount}, toAmount=${toAmount}`);

    
  }

  function handleAccounts(selectedAccount: YakklAccount) {
    // Handle the selected account here
    console.log('Selected account:', selectedAccount);
  }

  function handleContact(selectedContact: YakklContact) {
    // Handle the selected contact here
    console.log('Selected contact:', selectedContact);
  }
  
  function handleImport(account: YakklAccount) {
    // Handle the imported account here
    console.log('Imported account:', account);
  }

  function handleVerifyModal(pincode: string) {
    // Handle the pincode here
    console.log('Pincode:', pincode);
  }

  function handleVerify(pincodeOld: string, pincodeNew: string) {
    // Handle the pincode here
    console.log('Pincode - old and new:', pincodeOld, pincodeNew);
  }

  function handleImportWatch(account: YakklWatch) {
    // Handle the import watch account here
    console.log('Import watch account');
  }

  function handleExportPrivateKey() {
    // Handle the export private key here
    console.log('Export private key');
  }

  function handleImportPhrase() {
    // Handle the import phrase here
    console.log('Import phrase account:', account);
  }

  function handleEmergencyKit(success: boolean, message: string) {
    // Handle the emergency kit here
    showEmergencyKit = false;
    console.log('Emergency kit:', success, message);
  }

  function handleCreateAccount() {
    console.log('Create initial account');
    // Add your logic here
  }

  function handleImportPrivateKey() {
    console.log('Import an existing account');
    // Add your logic here
  }

  function handleRestore() {
    console.log('Restore from Emergency Kit');
    // Add your logic here
  }

  function handleCancel() {
    showRegistrationOptions = false;
    // Add any additional cancel logic here
  }

</script>

<div class="h-screen overflow-y-auto p-4">
  <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto bg-white p-4">
    {#each tokenDataArray as token}
      <div class="rounded-2xl overflow-hidden shadow-md">
        <TokenBox {token} />
      </div>
    {/each}
  </div>

  <div class="my-4">
    <RegistrationOptionModal bind:show={showRegistrationOptions} onCreate={handleCreateAccount} onImport={handleImportPrivateKey} onRestore={handleRestore} />
  </div>

  <div class="my-4">
    <SwapModal bind:show={showSwapModal} {fundingAddress} /> 
  </div>
  
  <div class="my-4">
    <Swap bind:show={showSwap} {fundingAddress} {onSwap} /> address - where the funds/crypto will come from
  </div>
  
  <div class="my-4">
    <ImportOptionModal bind:show={showImportOptions} showImportWatch={true} onImportKey={() => {showImportOptions=false; showImportAccount=true;}} onImportPhrase={() => {showImportOptions=false; showImportPhrase=true;}} onRestore={() => {showImportOptions=false; mode='import'; showEmergencyKit=true;}} onImportWatch={() => {showImportOptions=false; showImportWatch=true;}}/>
  </div>

  <div class="my-4">
    <ExportPrivateKey bind:show={showExportPrivateKey} onVerify={handleExportPrivateKey} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <PincodeModal bind:show={showPincodeModal} onVerify={handleVerifyModal} className="text-gray-600"/>
  </div>

  <div class="my-4">
    <Pincode bind:show={showPincode} onVerify={handleVerify} className="text-gray-600"/>
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

  <Profile bind:this={profileComponent} />

  <Preferences bind:this={preferencesComponent} />

  <div class="my-4 p-2 border-gray-100 border-2">
    <p class="text-gray-100 text-sm">Experimental Only</p>
    
    <button
      on:click={() => profileComponent.openProfile()}
      class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
      Open Profile
    </button>

    <button
      on:click={() => preferencesComponent.openPreferences()}
      class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
      Open Preferences
    </button>
  </div>

  <button
    on:click={() => showSwapModal = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    SwapModal
  </button>
  
  <button
    on:click={() => showSwap = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Swap
  </button>
  
  <button
    on:click={() => showRegistrationOptions = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Registration Options
  </button>
  
  <button
    on:click={() => showImportOptions = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Options
  </button>
  
  <button
    on:click={() => {showEmergencyKit = true; mode = 'export';}}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Export Emergency Kit
  </button>

  <button
    on:click={() => {showEmergencyKit = true; mode = 'import';}}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Emergency Kit
  </button>

  <button
    on:click={() => showExportPrivateKey = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Export Private Key
  </button>

  <button
    on:click={() => showPincode = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Pincode
  </button>

  <button
    on:click={() => showPincodeModal = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Pincode Modal
  </button>

  <button
    on:click={() => showReceive = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Receive
  </button>

  <button
    on:click={() => showContacts = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Contacts
  </button>

  <button
    on:click={() => showImportWatch = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Watch Account
  </button>

  <button
    on:click={() => showImportAccount = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Account w/PKey
  </button>

  <button
    on:click={() => {console.log('showImportPhrase'); showImportPhrase = true}}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Import Phrase
  </button>

  <button
    on:click={() => showAccounts = true}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Show Accounts
  </button>

  <button
    on:click={close}
    class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
    Cancel
  </button>
</div>
