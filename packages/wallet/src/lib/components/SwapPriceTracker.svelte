<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { SwapPriceData, SwapPriceProvider, SwapToken } from '$lib/common/interfaces';
  import type { BigNumberish } from '$lib/common';

  export let tokenIn: SwapToken | null = null;
  export let tokenOut: SwapToken | null = null;
  export let amountIn: BigNumberish = 0n;
  export let amountOut: BigNumberish = 0n;
  export let isExactIn: boolean = true;
  export let fee: number = 3000;
  export let updateInterval: number = 15000;
  export let priceProvider: SwapPriceProvider | null = null;

  const priceStore = writable<SwapPriceData | null>(null);
  let interval: NodeJS.Timeout;
  let initialized = false;
  
  
  onMount(async () => {
    try {
      // await initializeProvider();
      if (initialized && tokenIn && tokenOut) {
        await updatePrice();
        // Only start interval if we have both tokens
        interval = setInterval(updatePrice, updateInterval);
      }
    } catch (error) {
      console.error('SwapPriceTracker - Error in onMount:', error);
    }
  });

  // async function initializeProvider() {
  //   initialized = false;

  //   // if (!priceProvider && providers?.length === 0) {
  //     // let wallet: Wallet | null = null;

  //     try {
  //       // wallet = WalletManager.getInstance(
  //       //   ['Alchemy'],
  //       //   ['Ethereum'],
  //       //   chainId ?? 1,
  //       //   import.meta.env.VITE_ALCHEMY_API_KEY_PROD
  //       // );
        
  //       // if (!wallet) {
  //       //   throw new Error('SwapPriceTracker - Failed to initialize wallet');
  //       // }

  //       // provider = wallet.getProvider();        
  //       // if (!provider) {
  //       //   throw new Error('SwapPriceTracker - Failed to get provider from wallet');
  //       // }

  //       // await setPriceProvider(provider);
        
  //       console.log('SwapPriceTracker - Provider initialized successfully:', priceProvider);
  //     } catch (error) {
  //       console.error('SwapPriceTracker - Error initializing providers:', error);
  //       initialized = false;
  //       throw error;
  //     }
  //   // } else {
  //   //   priceProvider = providers ? providers[0] as UniswapSwapPriceProvider : getPriceProvider(provider);  // First one by default

  //   //   console.log('SwapPriceTracker - Using existing providers:', {providers, priceProvider});

  //   //   initialized = true;
  //   // }
  // }

  // function getPriceProvider(provider: Provider): UniswapSwapPriceProvider | null {
  //   if (providers && providers.length > 0) {
  //     priceProvider = providers.find((p) => p instanceof UniswapSwapPriceProvider) as UniswapSwapPriceProvider;

  //   }
  //   priceProvider = new UniswapSwapPriceProvider(provider, new CoinbasePriceProvider());
  //   if (!priceProvider) {
  //     throw new Error('SwapPriceTracker - Failed to create price provider');
  //   } else {
  //     providers.push(priceProvider);
  //     initialized = true;
  //     console.log('SwapPriceTracker - Price provider set - priceProvider, providers, initialized:', {priceProvider, providers, initialized});
  //     return priceProvider;
  //   }
  //   return null;
  // }

  // provider is the wallet provider for UniswapSwapPriceProvider 
  // async function setPriceProvider(provider: Provider): Promise<UniswapSwapPriceProvider> {
  //   initialized = false;

  //   if (providers.length > 0) {
  //     priceProvider = providers.find((p) => p instanceof UniswapSwapPriceProvider); // Change this later once using additional providers

  //     if (priceProvider) {
  //       initialized = true;
  //       console.log('SwapPriceTracker - Price provider ALREADY set - priceProvider, providers, initialized:', {priceProvider, providers, initialized});
  //       return priceProvider;
  //     }
  //   }
  //   priceProvider = new UniswapSwapPriceProvider(provider, new CoinbasePriceProvider());
  //   if (!priceProvider) {
  //     initialized = false;
  //     throw new Error('SwapPriceTracker - Failed to create price provider');
  //   } else {
  //     providers.push(priceProvider);
  //     initialized = true;
  //     console.log('SwapPriceTracker - Price provider set - priceProvider, providers, initialized:', {priceProvider, providers, initialized});
  //     return priceProvider;
  //   }
  // }

  async function updatePrice() {
    // Early return if not ready for price update
    if (!initialized || !priceProvider) {
      console.log('SwapPriceTracker - Price provider not initialized - initialized, priceProvider:', { initialized, priceProvider });
      if (interval) {
        clearInterval(interval);
      }
      priceStore.set(null);
      return;
    }

    if (!tokenIn || !tokenOut) {
      console.log('SwapPriceTracker - Both tokens must be selected', { tokenIn, tokenOut });
      priceStore.set(null);
      return;
    }

    try {
      let priceData: SwapPriceData | null = null;

      if (isExactIn) {      
        if (!amountIn || amountIn === 0n) {
          priceStore.set(null);
          return;
        }
        priceData = await priceProvider.getSwapPriceOut(tokenIn, tokenOut, amountIn, fee);
      } else {
        if (!amountOut || amountOut === 0n) {
          priceStore.set(null);
          return;
        }
        priceData = await priceProvider.getSwapPriceIn(tokenIn, tokenOut, amountOut, fee);
      }

      console.log('SwapPriceTracker - Price data:', priceData);
      if (priceData) {
        priceStore.set(priceData);
      }
      console.log('SwapPriceTracker - Price updated:', priceStore);

    } catch (error) {
      console.error('SwapPriceTracker - Error fetching swap price:', error);
      priceStore.set(null);
    }
  }

  async function waitForUpdatePrice() {
    await updatePrice();
  }

  $: if (initialized && tokenIn && tokenOut) {
    waitForUpdatePrice();

    if (interval) {
      clearInterval(interval);
    }
    interval = setInterval(updatePrice, updateInterval);
  }

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
      priceStore.set(null);
    }
  });
</script>

<slot price={$priceStore}></slot>
