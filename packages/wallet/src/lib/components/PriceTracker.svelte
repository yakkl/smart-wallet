<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { PriceData, PriceProvider } from '$lib/common/interfaces';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';

  export let baseToken: string;
  export let quoteToken: string;
  export let providers: PriceProvider[] = [new CoinbasePriceProvider()];
  export let updateInterval: number = 10000;

  const priceStore = writable<PriceData | null>(null);
  let interval: NodeJS.Timeout;

  async function updatePrice() {
    try {
      for (const provider of providers) {
        try {
          const priceData = await provider.getPrice(`${baseToken}-${quoteToken}`);
          if (priceData === null) {
            console.log(`PriceTracker failed to fetch price from ${provider.getName()}: ${baseToken}-${quoteToken}`);
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
        console.log('PriceTracker: No providers specified, allocating one...');
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
