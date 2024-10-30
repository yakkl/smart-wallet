<script lang="ts">
  import type { SwapPriceProvider, SwapToken } from '$lib/common/interfaces';
  import type { Provider } from '$lib/plugins/Provider';
  import type { Wallet } from '$lib/plugins/Wallet';
  import WalletManager from '$lib/plugins/WalletManager';
  import { onMount } from 'svelte';
  import SwapPriceTracker from './SwapPriceTracker.svelte';
	import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';
  import { UniswapSwapPriceProvider } from '$lib/plugins/providers/swapprice/uniswap/UniswapSwapPriceProvider';

  export let chainId: number = 1;
  export let tokenIn: SwapToken | null = null;
  export let tokenOut: SwapToken | null = null;
  export let amountIn: string = '0';
  export let amountOut: string = '0';
  export let isExactIn: boolean = true;
  export let updateInterval: number = 15000;
  export let fee: number = 3000;
  export let showLastUpdated: boolean = false;
  export let customClass: string = '';

  let swapProvider: SwapPriceProvider | null = null;
  let provider: Provider | null = null;

  onMount(async () => {
    try {
      let wallet: Wallet | null = null;

      wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
      if (wallet) {
        provider = wallet!.getProvider();
        if (provider) {
          swapProvider = new UniswapSwapPriceProvider(provider, new CoinbasePriceProvider());

          console.log('SwapTokenPrice: Provider initialized', swapProvider);
        }
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
      console.log('SwapTokenPrice and price to format:', error, price);
      return price.toString();
    }
  }

  function formatDate(date: Date): string {
    return date.toLocaleString();
  }

  function getSymbolPair(tokenIn: SwapToken | null, tokenOut: SwapToken | null): string {
    const inSymbol = tokenIn?.symbol || '';
    const outSymbol = tokenOut?.symbol || '';
    return inSymbol && outSymbol ? `${inSymbol}/${outSymbol}` : '';
  }

  function formatConversionRate(price: number | null | undefined, tokenIn: SwapToken | null, tokenOut: SwapToken | null): string {
    if (!price || !tokenIn || !tokenOut) return '';
    return `1 ${tokenIn.symbol} = ${price.toFixed(6)} ${tokenOut.symbol}`;
  }
</script>

<SwapPriceTracker {tokenIn} {tokenOut} {amountIn} {amountOut} {isExactIn} priceProvider={swapProvider} {updateInterval} {fee} let:price>
  <div class="flex flex-col w-full gap-1 {customClass}">
    <!-- Top row: Price and Balance -->
    <div class="flex justify-between items-center w-full">
      <div class="flex items-center gap-2">
        <!-- Token pair -->
        {#if tokenIn && tokenOut}
          <span class="text-sm text-gray-600">
            {getSymbolPair(tokenIn, tokenOut)}
          </span>
        {/if}
        
        <!-- Price display -->
        {#if price !== null && price !== undefined && typeof price.price === 'number'}
          <span class="text-sm font-semibold">
            {formatPrice(price.price)}
          </span>
        {:else}
          <span class="text-sm font-semibold text-gray-400">
            --
          </span>
        {/if}
      </div>
    </div>

    <!-- Bottom row: Last Updated -->
    <div class="flex justify-between items-center w-full text-xs text-gray-500">
      {#if showLastUpdated && price?.lastUpdated}
        <span>
          Last updated: {formatDate(price.lastUpdated)}
        </span>
      {/if}
    </div>
  </div>
</SwapPriceTracker>

<style>
  /* Ensure text doesn't overflow */
  .text-sm, .text-xs {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
