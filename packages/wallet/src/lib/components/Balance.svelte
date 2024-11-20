<script lang="ts">
  import { onMount } from 'svelte';
  import type { BigNumberish, BlockTag } from '$lib/common';
  import { ethers } from 'ethers';
	import type { Provider } from '$lib/plugins';

  export let symbol: string;
  export let address: string | null = null;
  export let blockTag: BlockTag | 'latest' = 'latest';
  export let units: number | string = 18;
  export let provider: Provider;
  export let className: string = '';
  export let balanceText: string = 'Balance: ';

  let balance: BigNumberish = 0n;

  onMount(async () => {
    if (!address || !provider) {
      return;
    }
    balance = await provider.getBalance(address, blockTag);
  });
</script>

<span class="text-gray-500 {className}">
  {balanceText}{ethers.formatUnits(balance ? balance.toString() : '0', units)} {symbol.toUpperCase()}
</span>

