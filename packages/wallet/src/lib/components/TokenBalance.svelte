<script lang="ts">
  import { onMount } from 'svelte';
  import type { SwapToken } from '$lib/common/interfaces';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
  import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
  import type { Provider } from '$lib/plugins';

  interface Props {
    token: SwapToken;
    address?: string | null;
    provider?: Provider | null;
    tokenService?: TokenService<any> | null;
    className?: string;
    balanceText?: string;
  }

  let {
    token,
    address = null,
    provider = null,
    tokenService = null,
    className = $bindable('text-gray-500 '),
    balanceText = 'Balance: '
  }: Props = $props();

  let balance: bigint = $state(0n);

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

  $effect(() => {
    if (token) {
      getBalance();
    }
  });
</script>

<span class={className}>
  {balanceText}{ethersv6.formatUnits(balance ? balance.toString() : '0', token.decimals)} {token.symbol}
</span>
















<!-- <script lang="ts">
  import { run } from 'svelte/legacy';

  import { onMount } from 'svelte';
  import type { SwapToken } from '$lib/common/interfaces';
  import { ethers as ethersv6 } from 'ethers-v6';
  import { getTokenBalance } from '$lib/utilities/balanceUtils';
	import type { TokenService } from '$lib/plugins/blockchains/evm/TokenService';
	import type { Provider } from '$lib/plugins';

  interface Props {
    token: SwapToken;
    address?: string | null;
    provider?: Provider | null;
    tokenService?: TokenService<any> | null;
    className?: string;
    balanceText?: string;
  }

  let {
    token,
    address = null,
    provider = null,
    tokenService = null,
    className = $bindable('text-gray-500 '),
    balanceText = 'Balance: '
  }: Props = $props();

  let balance: bigint = $state(0n);


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
  run(() => {
    if (token) getBalance();
  });
</script>

<span class="{className}">
  {balanceText}{ethersv6.formatUnits(balance ? balance.toString() : '0', token.decimals)} {token.symbol}
</span> -->
