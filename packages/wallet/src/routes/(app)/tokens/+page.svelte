<script lang="ts">
	import { goto } from '$app/navigation';
	import { PATH_WELCOME } from '$lib/common';
	import type { TokenData, YakklAccount, YakklContact } from '$lib/common/interfaces';
	import Accounts from '$lib/components/Accounts.svelte';
	import Contacts from '$lib/components/Contacts.svelte';
	import ImportPrivateKey from '$lib/components/ImportPrivateKey.svelte';
	import Receive from '$lib/components/Receive.svelte';
  import TokenBox from '$lib/components/TokenBox.svelte';
  import { ethTokenData, btcTokenData } from '$lib/data/mock/MockTokenData';

  // Mock token data array
  const tokenDataArray: TokenData[] = [ethTokenData, btcTokenData];

  let showImportAccount = false;
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

</script>

<div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto bg-white p-4">
  {#each tokenDataArray as token}
    <div class="rounded-2xl overflow-hidden shadow-md">
      <TokenBox {token} />
    </div>
  {/each}
</div>

<div class="my-4">
  <ImportPrivateKey bind:show={showImportAccount} onImportAccount={handleImport} className="text-gray-600"/>
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
  on:click={() => showImportAccount = true}
  class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
  Import Account w/PKey
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
