<script lang="ts">
	import { goto } from '$app/navigation';
	import { PATH_WELCOME } from '$lib/common';
	import type { TokenData, YakklAccount, YakklContact, YakklPrimaryAccount, YakklWatch } from '$lib/common/interfaces';
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

  import { Button } from "$lib/components/ui/button";
  import Profile from '$lib/components/Profile.svelte';
  import Preferences from '$lib/components/Preferences.svelte';
  
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
  let account: YakklAccount | null = null;

  $: {
    console.log('account', account);
  }

  function close() {
    goto(PATH_WELCOME);
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

  function handleImportPhrase(account: YakklPrimaryAccount) {
    // Handle the import phrase here
    console.log('Import phrase account:', account);
  }
</script>

<div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto bg-white p-4">
  {#each tokenDataArray as token}
    <div class="rounded-2xl overflow-hidden shadow-md">
      <TokenBox {token} />
    </div>
  {/each}
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
  <ImportWatchAccount bind:show={showImportWatch} onImportWatch={handleImportWatch} className="text-gray-600"/>
</div>

<div class="my-4">
  <ImportPrivateKey bind:show={showImportAccount} onImportAccount={handleImport} className="text-gray-600"/>
</div>

<div class="my-4">
  <ImportPhrase bind:show={showImportPhrase} onImportPhrase={handleImportPhrase} className="text-gray-600"/>
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

<Profile bind:this={profileComponent} />
<Preferences bind:this={preferencesComponent} />

<Button on:click={() => profileComponent.openProfile()}>Open Profile</Button>
<Button on:click={() => preferencesComponent.openPreferences()}>Open Preferences</Button>

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
