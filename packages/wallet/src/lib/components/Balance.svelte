<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwapToken } from '$lib/common/interfaces';
  import type { BigNumberish } from '$lib/common';
  import { ethers } from 'ethers';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';

  export let token: SwapToken;
  export let address: string | null = null;
  export let provider: any;
  export let tokenService: any;
  export let className: string = '';
  export let balanceText: string = 'Balance: ';

  let balance: BigNumberish = 0n;

  onMount(async () => {
    if (!address || !token) {
      return;
    }
    balance = await getTokenBalance(token, address, provider, tokenService);
  });
</script>

<span class="text-gray-500 {className}">
  {balanceText}{ethers.formatUnits(balance ? balance.toString() : '0', token.decimals)} {token.symbol}
</span>

