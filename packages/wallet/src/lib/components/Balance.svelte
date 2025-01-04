<script lang="ts">
  import { onMount } from 'svelte';
  import type { BigNumberish, BlockTag } from '$lib/common';
  import { ethers as ethersv6 } from 'ethers-v6';
	import type { Provider } from '$lib/plugins';

  interface Props {
    symbol: string;
    address?: string | null;
    blockTag?: BlockTag | 'latest';
    units?: number | string;
    provider: Provider;
    className?: string;
    balanceText?: string;
  }

  let {
    symbol,
    address = null,
    blockTag = 'latest',
    units = 18,
    provider,
    className = '',
    balanceText = 'Balance: '
  }: Props = $props();

  let balance: BigNumberish = $state(0n);

  onMount(async () => {
    if (!address || !provider) {
      return;
    }
    balance = await provider.getBalance(address, blockTag);
  });
</script>

<span class="text-gray-500 {className}">
  {balanceText}{ethersv6.formatUnits(balance ? balance.toString() : '0', units)} {symbol.toUpperCase()}
</span>

