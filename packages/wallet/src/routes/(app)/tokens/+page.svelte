<script lang="ts">
	import { goto } from '$app/navigation';
	import { PATH_WELCOME } from '$lib/common';
	import type { TokenData, YakklAccount } from '$lib/common/interfaces';
	import Accounts from '$lib/components/AccountsOriginal.svelte';
  import TokenBox from '$lib/components/TokenBox.svelte';
  import { ethTokenData, btcTokenData } from '$lib/data/mock/MockTokenData';

  // Mock token data array
  const tokenDataArray: TokenData[] = [ethTokenData, btcTokenData];

  let show = false;
  let account: YakklAccount | null = null;

  $: {
    console.log('account', account);
  }

  function close() {
    goto(PATH_WELCOME);
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
<Accounts bind:account={account} bind:show={show} />
</div>

<button
  on:click={() => show = true}
  class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
  Show Accounts
</button>

<button
  on:click={close}
  class="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg mt-3 hover:bg-gray-300 transition-colors">
  Cancel
</button>
