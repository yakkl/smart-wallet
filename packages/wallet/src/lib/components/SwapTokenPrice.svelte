<script lang="ts">
  import type { SwapPriceProvider, SwapToken } from '$lib/common/interfaces';
  import { yakklCurrentlySelectedStore } from '$lib/common/stores';
  import type { Provider } from '$lib/plugins/Provider';
  import { UniswapSwapPriceProvider } from '$lib/plugins/providers/swapprice/uniswap/UniswapSwapPriceProvider';
  import type { Wallet } from '$lib/plugins/Wallet';
  import WalletManager from '$lib/plugins/WalletManager';
  import { onMount } from 'svelte';
  import SwapPriceTracker from './SwapPriceTracker.svelte';
	import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';

  export let chainId: number = 1;
  export let tokenIn: SwapToken | null = null;
  export let tokenOut: SwapToken | null = null;
  export let amountIn: string = '0';
  export let amountOut: string = '0';
  export let isExactIn: boolean = true;
  export let showLastUpdated: boolean = false;
  export let customClass: string = '';

  let provider: SwapPriceProvider;

  onMount(async () => {
    try {
      let wallet: Wallet | null = null;
      let providerInstance: Provider | null = null;

      wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], $yakklCurrentlySelectedStore!.shortcuts.chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
      if (wallet) {
        providerInstance = wallet!.getProvider();
        provider = new UniswapSwapPriceProvider(providerInstance!, new CoinbasePriceProvider());
      }
    } catch(error) {
      console.log('SwapTokenPrice:', error);
    }
  });

  function formatPrice(price: number): string {
    try {
      let formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(price);

      return formattedPrice;
    } catch (error) {
      console.log('SwapTokenPrice:', error);
      return price.toString();
    }
  }

  function formatDate(date: Date): string {
    return date.toLocaleString();
  }
</script>

<SwapPriceTracker {chainId} {tokenIn} {tokenOut} {amountIn} {amountOut} {isExactIn} providers={[provider]} let:price>
  <div class={`flex flex-col items-start ${customClass}`}>
    {#if price !== null}
      <span class="text-xl font-bold">{formatPrice(price.price)}</span>
      <span class="text-xs text-gray-600">{tokenIn ? tokenIn.symbol : '--'}/{tokenOut ? tokenOut.symbol : '--'}</span>
      <span class="text-xs text-gray-500">Price Impact: {price.priceImpact.toFixed(2)}%</span>
      {#if showLastUpdated && price.lastUpdated}
        <span class="text-xs text-gray-500">Last updated: {formatDate(price.lastUpdated)}</span>
      {/if}
    {:else}
      <span class="text-xl font-bold">--</span>
      <span class="text-xs text-gray-600">{tokenIn ? tokenIn.symbol : '--'}/{tokenOut ? tokenOut.symbol : '--'}</span>
      <span class="text-xs text-gray-500">Price Impact: -- </span>
      {#if showLastUpdated}
        <span class="text-xs text-gray-500">Last updated: -- </span>
      {/if}
    {/if}
  </div>
</SwapPriceTracker>
