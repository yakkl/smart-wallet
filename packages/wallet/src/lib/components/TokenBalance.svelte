<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwapToken } from '$lib/common/interfaces';
  import { ethers } from 'ethers';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
	import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	import type { Provider } from '$lib/plugins';

  export let token: SwapToken;
  export let address: string | null = null;
  export let provider: Provider | null = null;
  export let tokenService: TokenService<any> | null = null;
  export let className: string = 'text-gray-500 ';
  export let balanceText: string = 'Balance: ';

  let balance: bigint = 0n;

  $: if (token) getBalance();

  onMount(async () => {
    await getBalance();
  });

  async function getBalance() {
    if (!address || !token) {
      balance = 0n;
    } else {
      balance = await getTokenBalance(token, address, provider, tokenService);
      if (balance <= 0n) className += 'text-red-500';
    }
  }
</script>

<span class="{className}">
  {balanceText}{ethers.formatUnits(balance ? balance.toString() : '0', token.decimals)} {token.symbol}
</span>
