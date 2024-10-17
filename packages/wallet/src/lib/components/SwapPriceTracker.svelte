<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { SwapPriceData, SwapPriceProvider, SwapToken } from '$lib/common/interfaces';
  import { UniswapSwapPriceProvider } from '$lib/plugins/providers/swapprice/uniswap/UniswapSwapPriceProvider';
	import type { Wallet } from '$lib/plugins/Wallet';
	import type { Provider } from '$lib/plugins/Provider';
	import WalletManager from '$lib/plugins/WalletManager';
	import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';

  export let chainId: number = 1;
  export let tokenIn: SwapToken | null = null;
  export let tokenOut: SwapToken | null = null;
  export let amountIn: string = '0';
  export let amountOut: string = '0';
  export let isExactIn: boolean = true;
  export let fee: number = 3000;
  export let providers: SwapPriceProvider[] = [];
  export let updateInterval: number = 10000;

  const priceStore = writable<SwapPriceData | null>(null);
  let interval: NodeJS.Timeout;

  async function updatePrice() {
    try {
      for (const provider of providers) {
        try {
          let priceData;
          if (tokenIn && tokenOut) {
            if (isExactIn) {
              priceData = await provider.getSwapPriceOut(tokenIn, tokenOut, amountIn, fee);
            } else {
              priceData = await provider.getSwapPriceIn(tokenIn, tokenOut, amountOut, fee);
            }
            if (priceData === null) {
              console.log(`SwapPriceTracker failed to fetch price from ${provider.getName()}`);
              continue;
            }
            priceStore.set(priceData);
          }
          break;
        } catch (error) {
          console.log(`Error fetching swap price from ${provider.getName()}:`, error);
        }
      }
    } catch (error) {
      console.log('SwapPriceTracker:', error);
    }
  }

  onMount(() => {
    if (providers.length === 0) {
      console.log('SwapPriceTracker: No providers specified, allocating one...');
      let wallet: Wallet | null = null;
      let provider: Provider | null = null;

      wallet = WalletManager.getInstance(['Alchemy'], ['Ethereum'], chainId ?? 1, import.meta.env.VITE_ALCHEMY_API_KEY_PROD);
      if (wallet) {
        provider = wallet!.getProvider();
      }
      providers = [new UniswapSwapPriceProvider(provider!, new CoinbasePriceProvider())];
    }

    updatePrice();
    interval = setInterval(updatePrice, updateInterval);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  $: if (tokenIn && tokenOut) {
    updatePrice();
  }
</script>

<slot price={$priceStore}></slot>
