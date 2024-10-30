<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { MarketPriceData, PriceProvider } from '$lib/common/interfaces';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';

  export let symbol: string; // In a swap this would be the fromToken
  export let currency: string; // In a swap this would be the toToken
  export let providers: PriceProvider[] = [new CoinbasePriceProvider()];
  export let updateInterval: number = 10000;

  const priceStore = writable<MarketPriceData | null>(null);
  let interval: NodeJS.Timeout;

  async function updatePrice() {
    try {
      for (const provider of providers) {
        try {
            const priceData = await provider.getMarketPrice(`${symbol}-${currency}`);
            if (priceData === null) {
              console.log(`PriceTracker failed to fetch price from ${provider.getName()}: ${symbol}-${currency}`);
              continue;
            }
            priceStore.set(priceData);
          break;
        } catch (error) {
          console.log(`Error fetching price from ${provider.getName()}:`, error);
        }
      }
    } catch (error) {
      console.log('PriceTracker:', error);
    }
  }

  onMount(() => {
    try {
      if (providers.length === 0) {
        providers = [new CoinbasePriceProvider()];
      }

      updatePrice();
      interval = setInterval(updatePrice, updateInterval);
    } catch (error) {
      console.log('PriceTracker:', error);
    }
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<slot price={$priceStore}></slot>
