<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import type { MarketPriceData, PriceProvider } from '$lib/common/interfaces';
  import { CoinbasePriceProvider } from '$lib/plugins/providers/price/coinbase/CoinbasePriceProvider';

  interface Props {
    symbol: string; // In a swap this would be the fromToken
    currency: string; // In a swap this would be the toToken
    providers?: PriceProvider[];
    updateInterval?: number;
    children?: import('svelte').Snippet<[any]>;
  }

  let {
    symbol,
    currency,
    providers = $bindable([new CoinbasePriceProvider()]),
    updateInterval = 10000,
    children
  }: Props = $props();

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

{@render children?.({ price: $priceStore, })}
