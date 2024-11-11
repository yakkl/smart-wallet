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

  onMount(async () => {
    if (!address || !token) {
      balanceText = 'Balance 0 due to missing address or token: ';
      balance = 0n;
    } else {
      if (token.isNative) {
        balance = provider ? await provider.getBalance(address) : 0n;
      } else {
        balance = await getTokenBalance(token, address, provider, tokenService);
      }
    }
  });
</script>

<span class="{className}">
  {balanceText}{ethers.formatUnits(balance ? balance.toString() : '0', token.decimals)} {token.symbol}
</span>
